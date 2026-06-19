import { io, Socket } from "socket.io-client";

// Get backend URL from env, or fallback to the same host on port 3001
// This ensures it works automatically when testing on a mobile phone on the same Wi-Fi
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:3001`;

export const socket: Socket = io(BACKEND_URL, {
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("Connected to backend via socket.io:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Disconnected from backend socket.io");
});
