import { Server, Socket } from "socket.io";
import { createRoom, joinRoom, leaveRoom, startGame, pickCard, castVote, resolveVotes, checkWinCondition, applyQuizPoints, applyPrivilege, getAlivePlayers, getRoom, rejoinRoom } from "../rooms/roomManager.js";
import type { Player } from "../types/game.js";
import { getCategories } from "../rooms/wordManager.js";
import { getRandomQuestion, getQuizCategories } from "../rooms/quizManager.js";

const disconnectTimers: Record<string, NodeJS.Timeout> = {};
const inactivityTimers: Record<string, NodeJS.Timeout> = {};
// quiz auto-end timers keyed by roomCode
const quizTimers: Record<string, NodeJS.Timeout> = {};

const QUIZ_DURATION_MS = 30_000; // 30 seconds per quiz round

/** Shared quiz-end logic — checks win condition then either emits game:won or starts next round */
function endQuiz(io: Server, roomCode: string) {
    if (quizTimers[roomCode]) {
        clearTimeout(quizTimers[roomCode]);
        delete quizTimers[roomCode];
    }

    const room = getRoom(roomCode);
    if (!room || room.phase !== "quiz") return;

    // Check win condition
    const { won, winners } = checkWinCondition(roomCode);
    if (won) {
        io.to(roomCode).emit("room:updated", getRoom(roomCode));
        io.to(roomCode).emit("game:won", {
            winners: winners.map((w: Player) => ({ id: w.id, name: w.name, score: w.score })),
        });
        return;
    }

    // +20 points for all alive players advancing to next round
    room.players.forEach(p => {
        if (p.status === "Alive") p.score += 20;
    });

    // Transition to discussion
    room.phase = "discussion";
    (room as any)._cluesSubmitted = new Set<string>();
    io.to(roomCode).emit("room:updated", room);
    io.to(roomCode).emit("round:started", { round: room.round });
}

export function registerGameHandlers(io: Server, socket: Socket) {
    const resetInactivity = () => {
        if (inactivityTimers[socket.id]) clearTimeout(inactivityTimers[socket.id]);
        inactivityTimers[socket.id] = setTimeout(() => {
            socket.emit("kicked:inactivity");
            socket.disconnect(true);
        }, 5 * 60 * 1000); // 5 minutes
    };

    socket.onAny(() => {
        resetInactivity();
    });
    resetInactivity();

    socket.on("room:create", (playerName: string) => {
        const room = createRoom({ id: socket.id, name: playerName });
        socket.join(room.code);
        socket.emit("room:created", room);
    });

    socket.on("room:join", (code: string, playerName: string) => {
        const player = { id: socket.id, name: playerName };
        const room = joinRoom(code, player);
        if (room) {
            socket.join(code);
            socket.emit("room:joined", room);
            socket.to(code).emit("room:updated", room);
        } else {
            socket.emit("room:error", "Room not found or game already started");
        }
    });

    socket.on("room:rejoin", (code: string, playerName: string) => {
        const room = rejoinRoom(code, playerName, socket.id);
        if (room) {
            socket.join(code);

            const player = room.players.find(p => p.id === socket.id);
            const strippedRoom = {
                ...room,
                civilianWord: undefined,
                undercoverWord: undefined,
                players: room.players.map((p) => ({ ...p, word: undefined, role: undefined })),
                currentQuestion: room.phase === "quiz" ? {
                    question: (room as any)._currentQuestionText,
                    options: (room as any)._currentQuestionOptions
                } : undefined,
                votesCast: Object.keys(room.votes || {}).length,
                totalVoters: room.players.filter(p => p.status !== "Eliminated").length,
            };

            socket.emit("room:rejoined", {
                ...strippedRoom,
                myRole: player?.role,
                myWord: player?.word,
                pendingCategory: (room as any)._pendingCategory ?? null,
            });

            socket.to(code).emit("room:updated", strippedRoom);

            if (disconnectTimers[playerName]) {
                clearTimeout(disconnectTimers[playerName]);
                delete disconnectTimers[playerName];
            }
        } else {
            socket.emit("session:expired");
        }
    });

    socket.on("room:leave", (code: string) => {
        const room = leaveRoom(code, socket.id);
        socket.leave(code);
        if (room) {
            socket.to(code).emit("room:updated", room);
        }
    });

    socket.on("disconnect", () => {
        if (inactivityTimers[socket.id]) {
            clearTimeout(inactivityTimers[socket.id]);
            delete inactivityTimers[socket.id];
        }

        socket.rooms.forEach((roomCode) => {
            if (roomCode === socket.id) return;
            const room = getRoom(roomCode);
            if (!room) return;

            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                player.connected = false;
                io.to(roomCode).emit("room:updated", room);

                disconnectTimers[player.name] = setTimeout(() => {
                    const updatedRoom = leaveRoom(roomCode, player.id);
                    if (updatedRoom) {
                        io.to(roomCode).emit("room:updated", updatedRoom);
                    }
                }, 5 * 60 * 1000);
            }
        });
    });

    socket.on("game:start", (data: { code: string, category?: string }) => {
        const room = startGame(data.code, socket.id, data.category);
        if (!room) {
            socket.emit("room:error", "Could not start game.");
            return;
        }

        room.players.forEach((player) => {
            io.to(player.id).emit("game:started", { category: room.category });
        });

        io.to(room.code).emit("room:updated", {
            ...room,
            civilianWord: undefined,
            undercoverWord: undefined,
            players: room.players.map((p) => ({ ...p, word: undefined, role: undefined })),
            cards: room.cards?.map(c => ({ id: c.id, pickedBy: c.pickedBy }))
        });
    });

    socket.on("game:pickCard", (data: { code: string, cardId: number }) => {
        const room = pickCard(data.code, socket.id, data.cardId);
        if (!room) return;

        io.to(room.code).emit("room:updated", {
            ...room,
            civilianWord: undefined,
            undercoverWord: undefined,
            players: room.players.map((p) => ({ ...p, word: undefined, role: undefined })),
            cards: room.cards?.map(c => ({ id: c.id, pickedBy: c.pickedBy }))
        });

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            socket.emit("game:roleRevealed", { role: player.role, word: player.word });
        }
    });

    socket.on("game:getCategories", () => {
        socket.emit("game:categories", getCategories());
    });

    // ── Lobby: quiz-theme categories from quiz.json ─────────────────
    socket.on("lobby:get_categories", () => {
        socket.emit("lobby:categories", getQuizCategories());
    });

    // ── Lobby: host picks a quiz theme → broadcast to whole room ───
    socket.on("lobby:category_change", (data: { roomCode: string; category: string }) => {
        const room = getRoom(data.roomCode);
        if (!room) return;
        // Only the host can change the category
        const player = room.players.find(p => p.id === socket.id);
        if (!player || !player.isHost) return;
        // Store it on the room so rejoiners can get it
        (room as any)._pendingCategory = data.category;
        // Broadcast to everyone in the room (including the host)
        io.to(data.roomCode).emit("lobby:category_changed", { category: data.category });
    });


    // ── Chat: alive players only ───────────────────────────────────────
    socket.on("chat:message", (data: { roomCode: string, message: string, playerName: string, color: string }) => {
        const room = getRoom(data.roomCode);
        if (!room) return;

        // Correction 2: strictly validate sender is Alive
        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.status !== "Alive") return;

        const chatMessage = {
            playerId: socket.id,
            playerName: data.playerName,
            color: data.color,
            message: data.message,
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        };

        io.to(data.roomCode).emit("chat:message", chatMessage);

        // Correction 3: Auto-progress to voting when all alive players have given a clue
        if (room.phase === "discussion") {
            const r = room as any;
            if (!r._cluesSubmitted) r._cluesSubmitted = new Set<string>();
            r._cluesSubmitted.add(socket.id);

            const alivePlayersCount = room.players.filter(p => p.status === "Alive").length;
            if (r._cluesSubmitted.size >= alivePlayersCount) {
                // Auto-trigger voting phase
                room.phase = "voting";
                room.votes = {};
                io.to(data.roomCode).emit("room:updated", room);
                io.to(data.roomCode).emit("vote:phase_started");
            }
        }
    });

    // ── Spectator chat: eliminated players only ────────────────────────
    socket.on("spectator:message", (data: { roomCode: string, message: string, playerName: string, color: string }) => {
        const room = getRoom(data.roomCode);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player?.status !== "Eliminated") return;

        const chatMessage = {
            playerId: socket.id,
            playerName: `${data.playerName} (${player.role ?? "?"})`,
            color: data.color,
            message: data.message,
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            isSpectator: true,
        };

        // Emit only to eliminated players
        room.players.forEach(p => {
            if (p.status === "Eliminated") {
                io.to(p.id).emit("chat:message", chatMessage);
            }
        });
    });

    // Correction 2: typing indicators alive-only
    socket.on("chat:typing", (roomCode: string) => {
        const room = getRoom(roomCode);
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.status !== "Alive") return;
        socket.to(roomCode).emit("chat:typing", socket.id);
    });

    socket.on("chat:stop_typing", (roomCode: string) => {
        const room = getRoom(roomCode);
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.status !== "Alive") return;
        socket.to(roomCode).emit("chat:stop_typing", socket.id);
    });

    socket.on("vote:cast", (data: { roomCode: string; targetId: string }) => {
        const success = castVote(data.roomCode, socket.id, data.targetId);
        if (!success) {
            socket.emit("room:error", "Vote could not be casted.");
            return;
        }

        const room = getRoom(data.roomCode);
        if (!room) return;

        const alivePlayers = getAlivePlayers(data.roomCode);
        const votesCast = Object.keys(room.votes).length;

        io.to(data.roomCode).emit("vote:updated", { votesCast, total: alivePlayers.length });

        if (votesCast >= alivePlayers.length) {
            const { eliminated, tied } = resolveVotes(data.roomCode);

            if (tied) {
                io.to(data.roomCode).emit("vote:tied");
            } else if (eliminated) {
                io.to(data.roomCode).emit("vote:eliminated", {
                    playerId: eliminated.id,
                    playerName: eliminated.name,
                    role: eliminated.role,
                });
            } else {
                // Immunity — no elimination
                io.to(data.roomCode).emit("vote:eliminated", null);
            }

            const updatedRoom = getRoom(data.roomCode);
            io.to(data.roomCode).emit("room:updated", updatedRoom);

            if (updatedRoom?.category) {
                const question = getRandomQuestion(updatedRoom.category);
                if (question) {
                    io.to(data.roomCode).emit("quiz:start", {
                        question: question.question,
                        options: question.options,
                        round: updatedRoom.round,
                    });

                    (updatedRoom as any)._currentAnswer = question.answer;
                    (updatedRoom as any)._currentQuestionText = question.question;
                    (updatedRoom as any)._currentQuestionOptions = question.options;
                    // Correction 1: track first *correct* answerer, not first to respond
                    (updatedRoom as any)._quizAnswered = [];       // anyone who submitted an answer
                    (updatedRoom as any)._firstCorrectId = null;   // first correct answerer
                    (updatedRoom as any)._answerTimer = Date.now();

                    // Correction 3: server-side timer auto-ends quiz
                    if (quizTimers[data.roomCode]) clearTimeout(quizTimers[data.roomCode]);
                    quizTimers[data.roomCode] = setTimeout(() => {
                        endQuiz(io, data.roomCode);
                    }, QUIZ_DURATION_MS);
                }
            }
        }
    });

    // Correction 3: vote:start is callable by any alive player (not host-only)
    socket.on("vote:start", (roomCode: string) => {
        const room = getRoom(roomCode);
        if (!room || room.phase !== "discussion") return;
        const player = room.players.find((p) => p.id === socket.id);
        if (!player || player.status !== "Alive") return;
        room.phase = "voting";
        room.votes = {};
        io.to(roomCode).emit("room:updated", room);
        io.to(roomCode).emit("vote:phase_started");
    });

    // Correction 1: privilege goes to the first CORRECT answerer
    socket.on("quiz:answer", (data: { roomCode: string; answerIndex: number }) => {
        const room = getRoom(data.roomCode) as any;
        if (!room || room.phase !== "quiz") return;

        const correctAnswer: number = room._currentAnswer;
        const alreadyAnswered: string[] = room._quizAnswered ?? [];

        // Each player can only answer once
        if (alreadyAnswered.includes(socket.id)) return;
        alreadyAnswered.push(socket.id);
        room._quizAnswered = alreadyAnswered;

        const isCorrect = data.answerIndex === correctAnswer;

        if (!isCorrect) {
            // Wrong answer — always 0pts, no privilege
            socket.emit("quiz:result", { correct: false, points: 0, hasPrivilege: false });
            return;
        }

        // Correct answer — check if first correct
        const isFirstCorrect = room._firstCorrectId === null;
        if (isFirstCorrect) {
            room._firstCorrectId = socket.id;
        }

        if (isFirstCorrect) {
            // First correct answerer: NO base points yet — they choose their privilege first
            io.to(data.roomCode).emit("quiz:fastest", { playerId: socket.id });

            const player = room.players.find((p: any) => p.id === socket.id);
            const isEliminated = player?.status === "Eliminated";

            if (isEliminated) {
                // Spectators get 15pts but NO privilege choice
                applyQuizPoints(data.roomCode, socket.id, 15);
                io.to(data.roomCode).emit("room:updated", getRoom(data.roomCode));
                socket.emit("quiz:result", { correct: true, points: 15, hasPrivilege: false });
            } else {
                // Alive players choose their reward — points are NOT applied yet
                socket.emit("quiz:result", { correct: true, points: 0, hasPrivilege: true });
                socket.emit("quiz:privilege_options", {
                    options: ["points", "immunity", "clue_request"],
                });
            }
        } else {
            // Not first correct — 10pts, no privilege
            applyQuizPoints(data.roomCode, socket.id, 10);
            io.to(data.roomCode).emit("room:updated", getRoom(data.roomCode));
            socket.emit("quiz:result", { correct: true, points: 10, hasPrivilege: false });
        }
    });

    socket.on("quiz:choose_privilege", (data: {
        roomCode: string;
        privilege: "points" | "immunity" | "clue_request";
        targetId?: string;
    }) => {
        const room = getRoom(data.roomCode);
        if (!room) return;

        applyPrivilege(data.roomCode, socket.id, data.privilege, data.targetId);

        if (data.privilege === "clue_request" && data.targetId) {
            io.to(data.targetId).emit("clue:requested", { requestedBy: socket.id });
            io.to(data.roomCode).emit("clue:request_announced", {
                requesterId: socket.id,
                targetId: data.targetId,
            });
        }

        io.to(data.roomCode).emit("room:updated", getRoom(data.roomCode));
        socket.emit("quiz:privilege_applied", { privilege: data.privilege });
    });

    // Correction 3: quiz:end is no longer player-triggered; this handler is removed.
    // The quiz ends automatically via quizTimers set in vote:cast.
}