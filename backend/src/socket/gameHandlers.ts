import { Server, Socket } from "socket.io";
import { createRoom, joinRoom, leaveRoom, startGame, pickCard, castVote, resolveVotes, checkWinCondition, applyQuizPoints, applyPrivilege, getAlivePlayers, getRoom } from "../rooms/roomManager.js";
import type { Player } from "../types/game.js";
import { getCategories } from "../rooms/wordManager.js";
import { getRandomQuestion } from "../rooms/quizManager.js";

export function registerGameHandlers(io: Server, socket: Socket) {
    socket.on("room:create", (playerName: string) => {
        const room = createRoom({ id: socket.id, name: playerName });
        socket.join(room.code);
        socket.emit("room:created", room);
    });

    socket.on("room:join", (code: string, playerName: string) => {
        const player = {
            id: socket.id,
            name: playerName
        };
        const room = joinRoom(code, player);
        if (room) {
            socket.join(code);
            socket.emit("room:joined", room);
            socket.to(code).emit("room:updated", room);
        } else {
            socket.emit("room:error", "Room not found or game already started");
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
        socket.rooms.forEach((roomCode) => {
            if (roomCode === socket.id) return;
            const updatedRoom = leaveRoom(roomCode, socket.id);
            if (updatedRoom) {
                io.to(roomCode).emit("room:updated", updatedRoom);
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
            io.to(player.id).emit("game:started", {
                category: room.category
            });
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
        if (!room) return; // Invalid pick

        // Sync card state
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

    socket.on("chat:send", (data: { roomId: string; type?: string; content?: string; isCritical?: boolean }) => {
        const room = getRoom(data.roomId);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        const playerName = player ? player.name : "System";

        const chatMessage = {
            playerId: socket.id,
            playerName: "System",
            color: "#EF4444", // System message color
            message: data.content || `${playerName} sent a system message`,
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            isSystem: true
        };

        io.to(data.roomId).emit("chat:message", chatMessage);
    });

    socket.on("chat:message", (data: { roomCode: string, message: string, playerName: string, color: string }) => {
        const room = getRoom(data.roomCode);
        if (!room) return;

        const chatMessage = {
            playerId: socket.id,
            playerName: data.playerName,
            color: data.color,
            message: data.message,
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        };

        io.to(data.roomCode).emit("chat:message", chatMessage);
    });

    socket.on("chat:typing", (roomCode: string) => {
        const room = getRoom(roomCode)
        if (!room) return;

        socket.to(roomCode).emit("chat:typing", socket.id);
    });

    socket.on("chat:stop_typing", (roomCode: string) => {
        const room = getRoom(roomCode);
        if (!room) return;

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
            }

            // Win condition will be checked at the end of the quiz phase

            const updatedRoom = getRoom(data.roomCode);
            if (updatedRoom?.category) {
                const question = getRandomQuestion(updatedRoom.category);
                if (question) {
                    io.to(data.roomCode).emit("quiz:start", {
                        question: question.question,
                        options: question.options,
                        round: updatedRoom.round,
                    });

                    (updatedRoom as any)._currentAnswer = question.answer;
                    (updatedRoom as any)._quizAnswered = [];
                    (updatedRoom as any)._answerTimer = Date.now();
                }
            }
        }
    });

    socket.on("vote:start", (roomCode: string) => {
        const room = getRoom(roomCode);
        if (!room) return;
        const player = room.players.find((p) => p.id === socket.id);
        if (!player?.isHost) return;
        room.phase = "voting";
        room.votes = {};
        io.to(roomCode).emit("vote:phase_started");
    });

    socket.on("quiz:answer", (data: { roomCode: string; answerIndex: number }) => {
        const room = getRoom(data.roomCode) as any;
        if (!room || room.phase !== "quiz") return;

        const correctAnswer = room._currentAnswer;
        const alreadyAnswered: string[] = room._quizAnswered ?? [];

        if (alreadyAnswered.includes(socket.id)) return;
        alreadyAnswered.push(socket.id);
        room._quizAnswered = alreadyAnswered;

        const isCorrect = data.answerIndex === correctAnswer;
        const isFirst = alreadyAnswered.length === 1;

        if (isFirst) {
            applyQuizPoints(data.roomCode, socket.id, 15);
            io.to(data.roomCode).emit("room:updated", getRoom(data.roomCode));
            socket.emit("quiz:result", { correct: true, points: 15, hasPrivilege: true });
            io.to(data.roomCode).emit("quiz:fastest", { playerId: socket.id });

            const player = room.players.find((p: any) => p.id === socket.id);
            const isSpectator = player?.status === "spectator";
            if (isSpectator) {
                socket.emit("quiz:privilege_options", { options: [] });
            } else {
                io.to(data.roomCode).emit("room:updated", getRoom(data.roomCode));
                socket.emit("quiz:privilege_options", {
                    options: ["points", "immunity", "clue_request"],
                });
            }
        } else if (isCorrect) {
            applyQuizPoints(data.roomCode, socket.id, 10);
            io.to(data.roomCode).emit("room:updated", getRoom(data.roomCode));
            socket.emit("quiz:result", { correct: true, points: 10, hasPrivilege: false });
        } else {
            socket.emit("quiz:result", { correct: false, points: 0, hasPrivilege: false });
        }
    })

    socket.on("quiz:choose_privilege", (data: {
        roomCode: string;
        privilege: "points" | "immunity" | "clue_request";
        targetId?: string;
    }) => {
        const room = getRoom(data.roomCode);
        if (!room) return;

        applyPrivilege(data.roomCode, socket.id, data.privilege, data.targetId);

        if (data.privilege === "clue_request" && data.targetId) {
            // Notify the targeted player they must submit a clue
            io.to(data.targetId).emit("clue:requested", { requestedBy: socket.id });
            io.to(data.roomCode).emit("clue:request_announced", {
                requesterId: socket.id,
                targetId: data.targetId,
            });
        }

        io.to(data.roomCode).emit("room:updated", getRoom(data.roomCode));
        socket.emit("quiz:privilege_applied", { privilege: data.privilege });
    });

    socket.on("quiz:end", (roomCode: string) => {
        const room = getRoom(roomCode);
        if (!room) return;
        
        const player = room.players.find(p => p.id === socket.id);
        if (!player || !player.isHost) return;

        // Check if game is won before transitioning to next round
        const { won, winners } = checkWinCondition(roomCode);
        if (won) {
            io.to(roomCode).emit("room:updated", getRoom(roomCode));
            io.to(roomCode).emit("game:won", {
                winners: winners.map((w: Player) => ({ id: w.id, name: w.name, score: w.score })),
            });
            return;
        }

        // +20 points for all alive players advancing to the next round
        room.players.forEach(p => {
            if (p.status === "Alive") {
                p.score += 20;
            }
        });

        // Transition back to discussion phase for the next round
        room.phase = "discussion";
        io.to(roomCode).emit("room:updated", room);
        io.to(roomCode).emit("round:started", { round: room.round });
    });
}