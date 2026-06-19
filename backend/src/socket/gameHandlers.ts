import { Server, Socket } from "socket.io";
import { createRoom, joinRoom, leaveRoom } from "../rooms/roomManager.js";
import type { Player } from "../types/game.js";

export function registerGameHandlers(io: Server, socket: Socket) {
    socket.on("room:create", (playerName: string) => {
        const player: Player = {
            id: socket.id,
            name: playerName,
            isHost: true,
            score: 0
        };
        const room = createRoom(player);
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
}