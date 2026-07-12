import type { Screen, Player, ChatMessage } from "../types";

// ── Constants ─────────────────────────────────────────────────────
import diagnosesData from "../../../../backend/src/data/diagnoses.json";

export const COLORS = ["#0D9488","#8B5CF6","#F97316","#EC4899","#3B82F6","#EAB308","#EF4444","#06B6D4"];
export const AVATARS = [
  "/avatars/avatar1.svg",
  "/avatars/avatar2.svg",
  "/avatars/avatar3.svg",
  "/avatars/avatar4.svg",
  "/avatars/avatar5.svg",
  "/avatars/avatar6.svg",
  "/avatars/avatar7.svg",
  "/avatars/avatar8.svg",
];
export const CATEGORIES = Object.keys(diagnosesData);

export const MOCK_PLAYERS: Player[] = [
  { id:"1", name:"Budi",  color:"#0D9488", role:"Civilian",   score:120, breakdown:"3 correct votes + clue quality" },
  { id:"2", name:"Siti",  color:"#8B5CF6", role:"Undercover", score:85,  breakdown:"Undercover — survived 2 rounds" },
  { id:"3", name:"Andi",  color:"#F97316", role:"Civilian",   score:110, breakdown:"2 correct votes + survival bonus" },
  { id:"4", name:"Dewi",  color:"#EC4899", role:"Mr White",  score:60,  breakdown:"Mr. White — guessed correctly" },
  { id:"5", name:"Reza",  color:"#3B82F6", role:"Civilian",   score:95,  breakdown:"1 correct vote + participation" },
];

export const CHAT_MESSAGES: ChatMessage[] = [
  { player:"Budi", color:"#0D9488", msg:"Menurutku ini berhubungan dengan jantung...", time:"14:32" },
  { player:"Siti", color:"#8B5CF6", msg:"Hmm, aku pikir lebih ke sistem pernapasan", time:"14:33" },
  { player:"Andi", color:"#F97316", msg:"Ada yang mencurigakan di sini!", time:"14:34" },
  { player:"Dewi", color:"#EC4899", msg:"Saya setuju dengan Budi, sepertinya itu aritmia", time:"14:35" },
];

export const SCREEN_META: Record<Screen, { title: string; subtitle: string }> = {
  home: { title:"Welcome", subtitle:"Choose your game mode" },
  guidebook: { title:"Guidebook", subtitle:"Rules, roles, and strategies" },
  "offline-players": { title:"Add Players", subtitle:"Build your team" },
  "offline-category": { title:"Disease Category", subtitle:"Pick a medical theme" },
  "offline-summary": { title:"Game Summary", subtitle:"Review and launch" },
  "online-join": { title:"Join the Battle", subtitle:"Create or join a room" },
  "lobby-main": { title:"Game Lobby", subtitle:"Room MED42K" },
  "lobby-players": { title:"Waiting Room", subtitle:"3 of 8 players joined" },
  "choose-role": { title:"Choose Your Card", subtitle:"Reveal your secret role" },
  "role-revealed": { title:"Role Revealed", subtitle:"You are: Civilian" },
  discussion: { title:"Discussion Phase", subtitle:"Share your diagnosis clue" },
  voting: { title:"Voting Phase", subtitle:"Eliminate the undercover" },
  finalist: { title:"You're a Finalist!", subtitle:"Awaiting final votes" },
  "final-submissions": { title:"Final Round", subtitle:"Review all submissions" },
  "game-over": { title:"Game Over!", subtitle:"Civilian Menang! 🏆" },
  quiz: { title:"Quiz Time", subtitle:"Answer fast for extra points!" },
  "session-expired": { title:"Session Ended", subtitle:"You have been disconnected" },
  "final-diagnosis": { title:"Final Round", subtitle:"Write your diagnosis solution" },
  "final-voting": { title:"Final Vote", subtitle:"Choose the best solution" },
  "offline-role": { title:"Choose Your Card", subtitle:"Reveal your secret role" },
  "offline-discussion": { title:"Discussion Phase", subtitle:"Share your diagnosis clue" },
  "offline-voting": { title:"Voting Phase", subtitle:"Eliminate the undercover" },
  "offline-quiz": { title:"Quiz Time", subtitle:"Answer fast for extra points!" },
  "offline-ranking": { title:"Final Ranking", subtitle:"See who won the game!" },
};
