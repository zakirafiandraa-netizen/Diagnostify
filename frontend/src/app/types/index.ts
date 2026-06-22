// ── Types ─────────────────────────────────────────────────────────
export type Screen =
  | "home" | "guidebook" | "offline-players" | "offline-category" | "offline-summary"
  | "online-join" | "lobby-main" | "lobby-players" | "choose-role"
  | "role-revealed" | "discussion" | "voting" | "finalist"
  | "final-submissions" | "game-over" | "quiz";

export interface Player {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  isHost?: boolean;
  role?: "Civilian" | "Undercover" | "Mr White";
  status?: "Alive" | "Eliminated";
  score?: number;
  breakdown?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer?: number; // only set locally after answered
}

export interface WinnerSummary {
  id: string;
  name: string;
  score: number;
}

export interface ChatMessage {
  player: string;
  color: string;
  msg: string;
  time: string;
}

export interface CardState {
  id: number;
  pickedBy?: string;
}
