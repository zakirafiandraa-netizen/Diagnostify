import type { Screen } from "../types";

const SESSION_KEY = "desktopdiagnostify_session";

export interface GameSession {
  roomCode: string;
  playerName: string;
  screen: Screen;
  timestamp: number;
}

export function saveSession(roomCode: string, playerName: string, screen: Screen) {
  const session: GameSession = {
    roomCode,
    playerName,
    screen,
    timestamp: Date.now()
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): GameSession | null {
  const data = sessionStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as GameSession;
  } catch (err) {
    console.error("Failed to parse session data", err);
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
