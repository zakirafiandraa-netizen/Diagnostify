// ── Types ─────────────────────────────────────────────────────────
export type Screen =
  | "home" | "offline-players" | "offline-category" | "offline-summary"
  | "online-join" | "lobby-main" | "lobby-players" | "choose-role"
  | "role-revealed" | "discussion" | "voting" | "finalist"
  | "final-submissions" | "game-over";

export interface Player {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  role?: "Civilian" | "Undercover" | "Mr. White";
  score?: number;
  breakdown?: string;
}

export interface ChatMessage {
  player: string;
  color: string;
  msg: string;
  time: string;
}
