import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { registerGameHandlers } from "./socket/gameHandlers.js";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log(`Player Joined!, ${socket.id}`);
    registerGameHandlers(io, socket);

    const TIMEOUT_MS = 5 * 60 * 1000;
    let inactivityTimer: ReturnType<typeof setTimeout>;

    function resetTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            console.log(`Player ${socket.id} disconnected due to inactivity.`);
            socket.emit("kicked:inactivity");
            socket.disconnect(true);
        }, TIMEOUT_MS);
    }
    resetTimer();

    socket.onAny(() => {
        resetTimer();
    });
    socket.on("disconnect", () => {
        clearTimeout(inactivityTimer);
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});