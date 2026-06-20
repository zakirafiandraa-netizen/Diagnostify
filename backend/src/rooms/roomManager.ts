import type { Room, Player, Card } from "../types/game.js";
import { getRandomPair, getCategories } from "./wordManager.js"

const rooms: Map<string, Room> = new Map();
function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function createRoom(hostPlayer: Omit<Player, "isHost" | "score">): Room {
    const player: Player = {
        id: hostPlayer.id,
        name: hostPlayer.name,
        isHost: true,
        score: 0
    };
    const code = generateRoomCode();
    const room: Room = {
        code,
        players: [player],
        status: "Waiting"
    };
    rooms.set(code, room);
    console.log(`Room created: ${code}`);
    return room;
}

export function joinRoom(code: string, newPlayer: Omit<Player, "isHost" | "score">): Room | null {
    const room = rooms.get(code);
    if (!room || room.status !== "Waiting") return null;

    const player: Player = {
        id: newPlayer.id,
        name: newPlayer.name,
        isHost: false,
        score: 0
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

    const player = room.players.find(p => p.id === playerId);
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
    const roles: { role: "Civilian" | "Undercover" | "Mr White", word: string }[] = [];
    roles.push({ role: "Undercover", word: pair.differential });
    for (let i = 1; i < room.players.length; i++) {
        roles.push({ role: "Civilian", word: pair.main });
    }
    
    // Shuffle roles
    roles.sort(() => Math.random() - 0.5);

    // Assign to cards
    room.cards = roles.map((r, index) => ({
        id: index,
        role: r.role,
        word: r.word
    }));

    // Clear existing roles from players
    room.players.forEach(p => {
        delete p.role;
        delete p.word;
    });

    return room;
}

export function pickCard(code: string, playerId: string, cardId: number): Room | null {
    const room = rooms.get(code);
    if (!room || room.status !== "In_Game" || !room.cards) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    // Player already picked?
    if (player.role) return null;

    const card = room.cards.find(c => c.id === cardId);
    if (!card || card.pickedBy) return null;

    card.pickedBy = playerId;
    player.role = card.role;
    player.word = card.word;

    return room;
}