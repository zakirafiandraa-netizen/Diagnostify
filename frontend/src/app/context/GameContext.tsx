import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { ReactNode } from "react";
import type { Screen, Player, ChatMessage, CardState, QuizQuestion, WinnerSummary } from "../types";
import { COLORS } from "../constants";
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
  myRole: string;
  myWord: string;
  gameCategory: string;
  cards: CardState[];
  // ── New: voting ───────────────────────────────────────────────
  votesCast: number;
  totalVoters: number;
  eliminatedPlayer: { id: string; name: string; role?: string } | null;
  voteTied: boolean;
  // ── New: quiz ─────────────────────────────────────────────────
  currentQuestion: QuizQuestion | null;
  quizRound: number;
  quizResult: { correct: boolean; points: number; hasPrivilege: boolean } | null;
  privilegeOptions: string[];
  fastestPlayerId: string | null;
  // ── New: game over ────────────────────────────────────────────
  winners: WinnerSummary[];
  civilianWord: string;
  undercoverWord: string;
  // ── New: clue request ─────────────────────────────────────────
  clueRequested: boolean;
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [myRole, setMyRole] = useState("");
  const [myWord, setMyWord] = useState("");
  const [gameCategory, setGameCategory] = useState("");
  const [cards, setCards] = useState<CardState[]>([]);
  // voting
  const [votesCast, setVotesCast] = useState(0);
  const [totalVoters, setTotalVoters] = useState(0);
  const [eliminatedPlayer, setEliminatedPlayer] = useState<{ id: string; name: string; role?: string } | null>(null);
  const [voteTied, setVoteTied] = useState(false);
  // quiz
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [quizRound, setQuizRound] = useState(0);
  const [quizResult, setQuizResult] = useState<{ correct: boolean; points: number; hasPrivilege: boolean } | null>(null);
  const [privilegeOptions, setPrivilegeOptions] = useState<string[]>([]);
  const [fastestPlayerId, setFastestPlayerId] = useState<string | null>(null);
  // game over
  const [winners, setWinners] = useState<WinnerSummary[]>([]);
  const [civilianWord, setCivilianWord] = useState("");
  const [undercoverWord, setUndercoverWord] = useState("");
  // clue request
  const [clueRequested, setClueRequested] = useState(false);

  const go = useCallback((s: Screen) => setScreen(prev => prev === s ? prev : s), []);

  useEffect(() => {
    setPlayerId(socket.id || "");
    const onConnect = () => setPlayerId(socket.id || "");

    // ── Room ──────────────────────────────────────────────────────
    const onRoomUpdated = (room: any) => {
      setRoomCode(room.code);
      setPlayers(room.players.map((p: any, i: number) => ({
        ...p,
        color: COLORS[i % COLORS.length],
        avatar: "🧑",
      })));
      if (room.cards) setCards(room.cards);
      if (room.civilianWord) setCivilianWord(room.civilianWord);
      if (room.undercoverWord) setUndercoverWord(room.undercoverWord);
    };

    const onGameStarted = (data: { category: string }) => {
      setGameCategory(data.category);
      setMyRole("");
      setMyWord("");
      setChatMessages([]);
      setScreen(prev => prev === "choose-role" ? prev : "choose-role");
    };

    const onRoleRevealed = (data: { role: string; word: string }) => {
      setMyRole(data.role);
      setMyWord(data.word);
      setScreen(prev => prev === "role-revealed" ? prev : "role-revealed");
    };

    const onChatMessage = (msg: any) => {
      if (msg && typeof msg === "object" && msg.playerName) {
        setChatMessages(prev => [
          ...prev,
          {
            player: msg.playerName,
            color: msg.color || "#3B82F6",
            msg: msg.message,
            time: msg.time,
          }
        ]);
      }
    };

    // ── Voting ────────────────────────────────────────────────────
    const onVotePhaseStarted = () => {
      setVotesCast(0);
      setVoteTied(false);
      setEliminatedPlayer(null);
      setScreen("voting");
    };

    const onVoteUpdated = (data: { votesCast: number; total: number }) => {
      setVotesCast(data.votesCast);
      setTotalVoters(data.total);
    };

    const onVoteEliminated = (data: { playerId: string; playerName: string; role?: string }) => {
      setEliminatedPlayer({ id: data.playerId, name: data.playerName, role: data.role });
      // Update local player status
      setPlayers(prev => prev.map(p =>
        p.id === data.playerId ? { ...p, status: "Eliminated" } : p
      ));
    };

    const onVoteTied = () => {
      setVoteTied(true);
    };

    // ── Quiz ──────────────────────────────────────────────────────
    const onQuizStart = (data: { question: string; options: string[]; round: number }) => {
      setCurrentQuestion({ question: data.question, options: data.options });
      setQuizRound(data.round);
      setQuizResult(null);
      setPrivilegeOptions([]);
      setFastestPlayerId(null);
      setScreen("quiz");
    };

    const onQuizResult = (data: { correct: boolean; points: number; hasPrivilege: boolean }) => {
      setQuizResult(data);
    };

    const onQuizFastest = (data: { playerId: string }) => {
      setFastestPlayerId(data.playerId);
    };

    const onPrivilegeOptions = (data: { options: string[] }) => {
      setPrivilegeOptions(data.options);
    };

    const onPrivilegeApplied = () => {
      setPrivilegeOptions([]);
    };

    const onClueRequested = () => {
      setClueRequested(true);
    };

    const onRoundStarted = (data: { round: number }) => {
      setQuizRound(data.round);
      setCurrentQuestion(null);
      setEliminatedPlayer(null);
      setVoteTied(false);
      setClueRequested(false);
      setScreen("discussion");
    };

    // ── Game Over ─────────────────────────────────────────────────
    const onGameWon = (data: { winners: WinnerSummary[] }) => {
      setWinners(data.winners);
      setScreen("game-over");
    };

    socket.on("connect", onConnect);
    socket.on("room:created", onRoomUpdated);
    socket.on("room:joined", onRoomUpdated);
    socket.on("room:updated", onRoomUpdated);
    socket.on("game:started", onGameStarted);
    socket.on("game:roleRevealed", onRoleRevealed);
    socket.on("chat:message", onChatMessage);
    socket.on("vote:phase_started", onVotePhaseStarted);
    socket.on("vote:updated", onVoteUpdated);
    socket.on("vote:eliminated", onVoteEliminated);
    socket.on("vote:tied", onVoteTied);
    socket.on("quiz:start", onQuizStart);
    socket.on("quiz:result", onQuizResult);
    socket.on("quiz:fastest", onQuizFastest);
    socket.on("quiz:privilege_options", onPrivilegeOptions);
    socket.on("quiz:privilege_applied", onPrivilegeApplied);
    socket.on("round:started", onRoundStarted);
    socket.on("game:won", onGameWon);
    socket.on("clue:requested", onClueRequested);

    return () => {
      socket.off("connect", onConnect);
      socket.off("room:created", onRoomUpdated);
      socket.off("room:joined", onRoomUpdated);
      socket.off("room:updated", onRoomUpdated);
      socket.off("game:started", onGameStarted);
      socket.off("game:roleRevealed", onRoleRevealed);
      socket.off("chat:message", onChatMessage);
      socket.off("vote:phase_started", onVotePhaseStarted);
      socket.off("vote:updated", onVoteUpdated);
      socket.off("vote:eliminated", onVoteEliminated);
      socket.off("vote:tied", onVoteTied);
      socket.off("quiz:start", onQuizStart);
      socket.off("quiz:result", onQuizResult);
      socket.off("quiz:fastest", onQuizFastest);
      socket.off("quiz:privilege_options", onPrivilegeOptions);
      socket.off("quiz:privilege_applied", onPrivilegeApplied);
      socket.off("round:started", onRoundStarted);
      socket.off("game:won", onGameWon);
      socket.off("clue:requested", onClueRequested);
    };
  }, []);

  const value = useMemo<GameState>(() => ({
    screen, go,
    players, setPlayers,
    selectedCategory, setSelectedCategory,
    roomCode, setRoomCode, chatMessages,
    playerId,
    myRole, myWord, gameCategory,
    cards,
    votesCast, totalVoters,
    eliminatedPlayer, voteTied,
    currentQuestion, quizRound, quizResult,
    privilegeOptions, fastestPlayerId,
    winners, civilianWord, undercoverWord,
    clueRequested,
  }), [
    screen, go, players, selectedCategory, roomCode, chatMessages,
    playerId, myRole, myWord, gameCategory, cards,
    votesCast, totalVoters, eliminatedPlayer, voteTied,
    currentQuestion, quizRound, quizResult, privilegeOptions, fastestPlayerId,
    winners, civilianWord, undercoverWord,
    clueRequested,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
