import type { Room, Player } from "../types/game.js";

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