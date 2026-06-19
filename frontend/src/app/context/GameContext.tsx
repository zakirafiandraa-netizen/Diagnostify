import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { ReactNode } from "react";
import type { Screen, Player, ChatMessage } from "../types";
import { COLORS, CHAT_MESSAGES as DEFAULT_CHAT } from "../constants";
import { socket } from "../services/socket";

// ── Game State ────────────────────────────────────────────────────
interface GameState {
  screen: Screen;
  go: (s: Screen) => void;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  roomCode: string;
  setRoomCode: (code: string) => void;
  chatMessages: ChatMessage[];
  playerId: string;
}

const GameContext = createContext<GameState | null>(null);

export function useGame(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within <GameProvider>");
  return ctx;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("home");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Acak");
  const [chatMessages] = useState<ChatMessage[]>(DEFAULT_CHAT);
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState("");

  const go = useCallback((s: Screen) => setScreen(s), []);

  useEffect(() => {
    setPlayerId(socket.id || "");
    const onConnect = () => setPlayerId(socket.id || "");
    
    const onRoomUpdated = (room: any) => {
      setRoomCode(room.code);
      setPlayers(room.players.map((p: any, i: number) => ({
        ...p,
        color: COLORS[i % COLORS.length],
        avatar: "🧑", // Default avatar until backend supports customization
      })));
    };

    socket.on("connect", onConnect);
    socket.on("room:created", onRoomUpdated);
    socket.on("room:joined", onRoomUpdated);
    socket.on("room:updated", onRoomUpdated);

    return () => {
      socket.off("connect", onConnect);
      socket.off("room:created", onRoomUpdated);
      socket.off("room:joined", onRoomUpdated);
      socket.off("room:updated", onRoomUpdated);
    };
  }, []);

  const value = useMemo<GameState>(() => ({
    screen, go,
    players, setPlayers,
    selectedCategory, setSelectedCategory,
    roomCode, setRoomCode, chatMessages,
    playerId
  }), [screen, go, players, selectedCategory, roomCode, chatMessages, playerId]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
