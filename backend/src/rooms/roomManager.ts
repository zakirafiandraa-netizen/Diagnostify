import type { Room, Player, Card } from "../types/game.js";
import { getRandomPair, getCategories } from "./wordManager.js";

const rooms: Map<string, Room> = new Map();

function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function createRoom(hostPlayer: Omit<Player, "isHost" | "score" | "status" | "immuneThisRound">): Room {
    const player: Player = {
        id: hostPlayer.id,
        name: hostPlayer.name,
        isHost: true,
        score: 0,
        status: "Alive",
        immuneThisRound: false,
        connected: true,
    };
    const code = generateRoomCode();
    const room: Room = {
        code,
        players: [player],
        status: "Waiting",
        round: 0,
        phase: "discussion",
        votes: {},
        immunePlayers: [],
        clueRequests: [],
    };
    rooms.set(code, room);
    console.log(`Room created: ${code}`);
    return room;
}

export function joinRoom(code: string, newPlayer: Omit<Player, "isHost" | "score" | "status" | "immuneThisRound">): Room | null {
    const room = rooms.get(code);
    if (!room || room.status !== "Waiting") return null;

    const player: Player = {
        id: newPlayer.id,
        name: newPlayer.name,
        isHost: false,
        score: 0,
        status: "Alive",
        immuneThisRound: false,
        connected: true,
    };

    room.players.push(player);
    return room;
}

export function leaveRoom(code: string, playerId: string): Room | null {
    const room = rooms.get(code);
    if (!room) return null;
    room.players = room.players.filter((p) => p.id !== playerId);
    if (room.players.length == 0) {
        rooms.delete(code);
        console.log(`Room deleted: ${code}`);
        return null;
    }
    if (!room.players.find((p) => p.isHost)) {
        room.players[0]!.isHost = true;
    }
    return room;
}

export function getRoom(code: string): Room | undefined {
    return rooms.get(code);
}

export function startGame(code: string, playerId: string, category?: string): Room | null {
    const room = rooms.get(code);
    if (!room || room.status !== "Waiting") return null;
    if (room.players.length < 3) return null;

    const player = room.players.find((p) => p.id === playerId);
    if (!player || !player.isHost) return null;

    let selectedCategory = category;
    if (!selectedCategory || !getCategories().includes(selectedCategory)) {
        selectedCategory = getCategories()[Math.floor(Math.random() * getCategories().length)]!;
    }

    const pair = getRandomPair(selectedCategory);
    if (!pair) return null;

    room.status = "In_Game";
    room.category = selectedCategory;
    room.civilianWord = pair.main;
    room.undercoverWord = pair.differential;

    // Create cards pool
    const roles: { role: "Civilian" | "Undercover" | "Mr White"; word: string }[] = [];
    roles.push({ role: "Undercover", word: pair.differential });
    if (room.players.length >= 5) {
        roles.push({ role: "Mr White", word: "" });
    }
    const targetCivilians = room.players.length - roles.length;
    for (let i = 0; i < targetCivilians; i++) {
        roles.push({ role: "Civilian", word: pair.main });
    }

    // Shuffle roles using Fisher-Yates
    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j]!, roles[i]!];
    }

    // Assign to cards
    room.cards = roles.map((r, index) => ({
        id: index,
        role: r.role,
        word: r.word,
    }));

    // Clear existing roles from players
    room.players.forEach((p) => {
        delete p.role;
        delete p.word;
    });

    return room;
}

export function pickCard(code: string, playerId: string, cardId: number): Room | null {
    const room = rooms.get(code);
    if (!room || room.status !== "In_Game" || !room.cards) return null;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return null;

    // Player already picked?
    if (player.role) return null;

    const card = room.cards.find((c) => c.id === cardId);
    if (!card || card.pickedBy) return null;

    card.pickedBy = playerId;
    player.role = card.role;
    player.word = card.word;

    return room;
}

export function getAlivePlayers(code: string): Player[] {
    const room = rooms.get(code);
    if (!room) return [];
    return room.players.filter((p) => p.status === "Alive");
}

export function castVote(code: string, voterId: string, targetId: string): boolean {
    const room = rooms.get(code);
    if (!room || room.phase !== "voting") return false;
    const voter = room.players.find((p) => p.id === voterId);
    if (!voter || voter.status !== "Alive") return false;
    room.votes[voterId] = targetId;
    return true;
}

export function resolveVotes(code: string): { eliminated: Player | null; tied: boolean } {
    const room = rooms.get(code);
    if (!room) return { eliminated: null, tied: false };

    const tally: Record<string, number> = {};
    for (const targetId of Object.values(room.votes)) {
        tally[targetId] = (tally[targetId] ?? 0) + 1;
    }

    const sorted = Object.entries(tally).sort((a, b) => b[1]! - a[1]!);
    if (sorted.length === 0) return { eliminated: null, tied: true };

    // FIX: non-null assertion required with noUncheckedIndexedAccess
    const [topId, topVotes] = sorted[0]!;
    const tied = sorted.length > 1 && sorted[1]![1] === topVotes;

    if (tied) {
        room.votes = {};
        room.immunePlayers = [];   // FIX: was {}, must be []
        room.clueRequests = [];    // FIX: was {}, must be []
        room.round += 1;
        room.phase = "quiz";
        return { eliminated: null, tied: true };
    }

    const eliminated = room.players.find((p) => p.id === topId) ?? null;

    if (eliminated && room.immunePlayers.includes(eliminated.id)) {
        room.votes = {};
        room.immunePlayers = [];   // FIX: was {}, must be []
        room.clueRequests = [];    // FIX: was {}, must be []
        room.round += 1;
        room.phase = "quiz";
        return { eliminated: null, tied: false };
    }

    // FIX: missing elimination path — mark player and advance phase
    if (eliminated) eliminated.status = "Eliminated";

    room.votes = {};
    room.immunePlayers = [];
    room.clueRequests = [];
    room.round += 1;
    room.phase = "quiz";

    return { eliminated, tied: false };
}

export function applyQuizPoints(code: string, playerId: string, points: number): void {
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (player) player.score += points;
}

// FIX: renamed param from `privilige` to `privilege` consistently; added null guard on room
export function applyPrivilege(
    code: string,
    playerId: string,
    privilege: "points" | "immunity" | "clue_request",
    targetId?: string
): boolean {
    const room = rooms.get(code);
    if (!room) return false;   // FIX: missing null guard
    if (privilege === "immunity") {
        room.immunePlayers.push(playerId);
    } else if (privilege === "clue_request" && targetId) {
        room.clueRequests.push(targetId);
    } else if (privilege === "points") {
        // Player chose the points reward — award 15 pts
        const player = room.players.find(p => p.id === playerId);
        if (player) player.score += 15;
    }
    return true;
}

export function checkWinCondition(code: string): { won: boolean; winners: Player[] } {
    const room = rooms.get(code);
    if (!room) return { won: false, winners: [] };

    const alive = room.players.filter((p) => p.status === "Alive");

    // Game ends when 3 players remain
    if (alive.length <= 3) {
        room.phase = "finished";
        alive.forEach((p) => {
            p.score += 50;
        });
        return { won: true, winners: alive };
    }

    return { won: false, winners: [] };
}

export function rejoinRoom(code: string, playerName: string, newSocketId: string): Room | null {
    const room = rooms.get(code);
    if (!room) return null;

    const player = room.players.find((p) => p.name === playerName);
    if (!player) return null;

    const oldSocketId = player.id;
    player.id = newSocketId;
    player.connected = true;

    // Swap socket IDs in other structures
    if (room.cards) {
        room.cards.forEach(c => {
            if (c.pickedBy === oldSocketId) c.pickedBy = newSocketId;
        });
    }

    const newVotes: Record<string, string> = {};
    for (const [voter, target] of Object.entries(room.votes)) {
        const newVoter = voter === oldSocketId ? newSocketId : voter;
        const newTarget = target === oldSocketId ? newSocketId : target;
        newVotes[newVoter] = newTarget;
    }
    room.votes = newVotes;

    room.immunePlayers = room.immunePlayers.map(id => id === oldSocketId ? newSocketId : id);
    room.clueRequests = room.clueRequests.map(id => id === oldSocketId ? newSocketId : id);

    if (room.finalists) {
        room.finalists = room.finalists.map(id => id === oldSocketId ? newSocketId : id);
    }

    if (room.finalSolutions && oldSocketId in room.finalSolutions) {
        room.finalSolutions[newSocketId] = room.finalSolutions[oldSocketId]!;
        delete room.finalSolutions[oldSocketId];
    }
    if (room.solutionLabels && oldSocketId in room.solutionLabels) {
        room.solutionLabels[newSocketId] = room.solutionLabels[oldSocketId]!;
        delete room.solutionLabels[oldSocketId];
    }
    if (room.solutionVotes) {
        const newSolutionVotes: Record<string, string> = {};
        for (const [voter, target] of Object.entries(room.solutionVotes)) {
            const newVoter = voter === oldSocketId ? newSocketId : voter;
            const newTarget = target === oldSocketId ? newSocketId : target;
            newSolutionVotes[newVoter] = newTarget;
        }
        room.solutionVotes = newSolutionVotes;
    }

    const anyRoom = room as any;
    if (anyRoom._quizAnswered) {
        anyRoom._quizAnswered = anyRoom._quizAnswered.map((id: string) => id === oldSocketId ? newSocketId : id);
    }
    // Remap cached quiz results to the new socket ID so replay works after reconnect
    if (anyRoom._quizResults && oldSocketId in anyRoom._quizResults) {
        anyRoom._quizResults[newSocketId] = anyRoom._quizResults[oldSocketId];
        delete anyRoom._quizResults[oldSocketId];
    }
    if (anyRoom._cluesSubmitted) {
        const newSet = new Set<string>();
        for (const id of anyRoom._cluesSubmitted) {
            newSet.add(id === oldSocketId ? newSocketId : id);
        }
        anyRoom._cluesSubmitted = newSet;
    }
    if (anyRoom._firstCorrectId === oldSocketId) {
        anyRoom._firstCorrectId = newSocketId;
    }

    return room;
}

export function getEliminatedPlayers(code: string): Player[] {
    const room = rooms.get(code);
    if (!room) return [];
    return room.players.filter((p) => p.status === "Eliminated");
}

export function startFinalRound(code: string): Room | null {
    const room = rooms.get(code);
    if (!room || room.finalRoundStarted) return room ?? null;

    const alive = room.players.filter((p) => p.status === "Alive");
    if (alive.length > 3) return room;

    room.finalRoundStarted = true;
    room.finalists = alive.map((p) => p.id);
    room.phase = "final_diagnosis";
    room.finalSolutions = {};
    room.solutionVotes = {};
    room.solutionLabels = {};

    alive.forEach((p) => { p.score += 50; });

    return room;
}

export function submitFinalSolution(code: string, playerId: string, solution: string): Room | null {
    const room = rooms.get(code);
    if (!room || room.phase !== "final_diagnosis") return null;
    if (!room.finalists?.includes(playerId)) return null;

    room.finalSolutions = room.finalSolutions ?? {};
    room.finalSolutions[playerId] = solution;

    if (room.finalists.every((id) => room.finalSolutions![id])) {
        const shuffled = [...room.finalists];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
        }
        const labels = ["A", "B", "C"];
        room.solutionLabels = {};
        shuffled.forEach((id, idx) => { room.solutionLabels![id] = labels[idx]!; });
        room.phase = "final_voting";
    }

    return room;
}

export function castSolutionVote(code: string, voterId: string, finalistId: string): boolean {
    const room = rooms.get(code);
    if (!room || room.phase !== "final_voting") return false;

    const voter = room.players.find(p => p.id === voterId);
    if (!voter || voter.status !== "Eliminated") return false;

    room.solutionVotes = room.solutionVotes ?? {};
    room.solutionVotes[voterId] = finalistId;
    return true;
}

export function resolveFinalVotes(code: string): { scores: Record<string, number>; winners: Player[] } {
    const room = rooms.get(code);
    if (!room) return { scores: {}, winners: [] };

    const scores: Record<string, number> = {};
    for (const finalistId of Object.values(room.solutionVotes ?? {})) {
        scores[finalistId] = (scores[finalistId] ?? 0) + 1;
    }

    for (const [finalistId, voteCount] of Object.entries(scores)) {
        const player = room.players.find((p) => p.id === finalistId);
        if (player) player.score += voteCount * 10;
    }

    room.phase = "finished";
    const finalist = room.players.filter((p) => room.finalists?.includes(p.id));
    const topScore = Math.max(...finalist?.map((p) => p.score));
    const winners = finalist?.filter((p) => p.score === topScore);

    return { scores, winners };
}
