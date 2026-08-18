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
//debug
io.on("connection", (socket) => {
    console.log(`Player Joined!, ${socket.id}`);
    registerGameHandlers(io, socket);

    socket.on("disconnect", () => {
        console.log(`Player ${socket.id} disconnected.`);
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});