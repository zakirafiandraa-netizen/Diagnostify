import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { ReactNode } from "react";
import type { Screen, Player, ChatMessage, CardState, QuizQuestion, WinnerSummary, FinalSolutionEntry, FinalRevealEntry } from "../types";
import { COLORS } from "../constants";
import { socket } from "../services/socket";
import { loadSession, clearSession, saveSession } from "../services/session";

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
  setClueRequested: (val: boolean) => void;
  // ── New: final round ──────────────────────────────────────────
  finalists: string[];
  finalDiagnosis: string;
  finalSolutions: FinalSolutionEntry[];
  finalSolutionVotes: { votesCast: number; total: number };
  finalReveal: FinalRevealEntry[];
  solutionsSubmittedCount: number;
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
  const [playerId, setPlayerId] = useState(() => socket.id || "");
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
  // final round
  const [finalists, setFinalists] = useState<string[]>([]);
  const [finalDiagnosis, setFinalDiagnosis] = useState("");
  const [finalSolutions, setFinalSolutions] = useState<FinalSolutionEntry[]>([]);
  const [finalSolutionVotes, setFinalSolutionVotes] = useState({ votesCast: 0, total: 0 });
  const [finalReveal, setFinalReveal] = useState<FinalRevealEntry[]>([]);
  const [solutionsSubmittedCount, setSolutionsSubmittedCount] = useState(0);

  const go = useCallback((s: Screen) => setScreen(prev => prev === s ? prev : s), []);

  useEffect(() => {
    const onConnect = () => {
      setPlayerId(socket.id || "");
      const session = loadSession();
      if (session) {
        socket.emit("room:rejoin", session.roomCode, session.playerName);
      }
    };

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
      // Keep finalists in sync — a finalist's socket ID changes on refresh,
      // so we must update this array whenever room state is broadcast
      if (room.finalists) setFinalists(room.finalists);
    };


    const onGameStarted = (data: { category: string }) => {
      setGameCategory(data.category);
      setMyRole("");
      setMyWord("");
      setChatMessages([]);
      setScreen("choose-role");
    };

    const onRoleRevealed = (data: { role: string; word: string }) => {
      setMyRole(data.role);
      setMyWord(data.word);
      setScreen("role-revealed");
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
            isSpectator: msg.isSpectator,
          }
        ]);
      }
    };

    // ── Voting ────────────────────────────────────────────────────
    const onVotePhaseStarted = () => {
      setVotesCast(0);
      setVoteTied(false);
      setEliminatedPlayer(null);
      setClueRequested(false);
      setScreen("voting");
    };

    const onVoteUpdated = (data: { votesCast: number; total: number }) => {
      setVotesCast(data.votesCast);
      setTotalVoters(data.total);
    };

    const onVoteEliminated = (data: { playerId: string; playerName: string; role?: string } | null) => {
      if (!data) return;

      setEliminatedPlayer({
        id: data.playerId,
        name: data.playerName,
        role: data.role,
      });

      setPlayers(prev =>
        prev.map(p =>
          p.id === data.playerId
            ? { ...p, status: "Eliminated" as const }
            : p
        )
      );
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
      setScreen("discussion");
    };

    // ── Final Round ───────────────────────────────────────────────
    const onFinalSolutionPhase = (data: { finalists: string[]; diagnosis: string }) => {
      setFinalists(data.finalists);
      setFinalDiagnosis(data.diagnosis);
      setSolutionsSubmittedCount(0);
      setFinalSolutions([]);
      setFinalReveal([]);
      setFinalSolutionVotes({ votesCast: 0, total: 0 });
      setScreen("final-diagnosis");
    };

    const onFinalSolutionSubmitted = () => {
      setSolutionsSubmittedCount(prev => prev + 1);
    };

    const onFinalVotingStarted = (data: { solutions: FinalSolutionEntry[] }) => {
      setFinalSolutions(data.solutions);
      setScreen("final-voting");
    };

    const onFinalSolutionVoteUpdated = (data: { votesCast: number; total: number }) => {
      setFinalSolutionVotes(data);
    };

    const onFinalResults = (data: { reveal: FinalRevealEntry[] }) => {
      setFinalReveal(data.reveal);
    };

    // ── Game Over ─────────────────────────────────────────────────
    const onGameWon = (data: { winners: WinnerSummary[] }) => {
      setWinners(data.winners);
      clearSession();
      setScreen("game-over");
    };

    // ── Session & Kicks ───────────────────────────────────────────
    const onRoomRejoined = (data: any) => {
      setRoomCode(data.code);
      setPlayers(data.players.map((p: any, i: number) => ({
        ...p,
        color: COLORS[i % COLORS.length],
        avatar: "🧑",
      })));
      if (data.cards) setCards(data.cards);
      if (data.myRole) setMyRole(data.myRole);
      if (data.myWord) setMyWord(data.myWord);
      if (data.category) setGameCategory(data.category);
      if (data.pendingCategory) setSelectedCategory(data.pendingCategory);
      if (data.votesCast !== undefined) setVotesCast(data.votesCast);
      if (data.totalVoters !== undefined) setTotalVoters(data.totalVoters);
      if (data.currentQuestion) setCurrentQuestion(data.currentQuestion);
      if (data.round !== undefined) setQuizRound(data.round);

      const session = loadSession();
      if (session) {
        setScreen(session.screen);
      }
    };

    const onSessionExpired = () => {
      clearSession();
      setScreen("session-expired");
    };

    const onKickedInactivity = () => {
      clearSession();
      alert("You have been kicked for inactivity.");
      setScreen("home");
    };

    // ── Lobby: category sync ──────────────────────────────
    const onLobbyCategoryChanged = (data: { category: string }) => {
      setSelectedCategory(data.category);
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
    socket.on("room:rejoined", onRoomRejoined);
    socket.on("session:expired", onSessionExpired);
    socket.on("kicked:inactivity", onKickedInactivity);
    socket.on("lobby:category_changed", onLobbyCategoryChanged);
    socket.on("final:solution_phase", onFinalSolutionPhase);
    socket.on("final:solution_submitted", onFinalSolutionSubmitted);
    socket.on("final:voting_started", onFinalVotingStarted);
    socket.on("final:solution_vote_updated", onFinalSolutionVoteUpdated);
    socket.on("final:results", onFinalResults);

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
      socket.off("room:rejoined", onRoomRejoined);
      socket.off("session:expired", onSessionExpired);
      socket.off("kicked:inactivity", onKickedInactivity);
      socket.off("lobby:category_changed", onLobbyCategoryChanged);
      socket.off("final:solution_phase", onFinalSolutionPhase);
      socket.off("final:solution_submitted", onFinalSolutionSubmitted);
      socket.off("final:voting_started", onFinalVotingStarted);
      socket.off("final:solution_vote_updated", onFinalSolutionVoteUpdated);
      socket.off("final:results", onFinalResults);
    };
  }, []);

  useEffect(() => {
    if (roomCode && playerId && screen !== "home" && screen !== "game-over" && screen !== "session-expired") {
      const player = players.find(p => p.id === playerId);
      if (player) {
        saveSession(roomCode, player.name, screen);
      }
    }
  }, [screen, roomCode, playerId, players]);

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
    clueRequested, setClueRequested,
    finalists, finalDiagnosis, finalSolutions, finalSolutionVotes, finalReveal, solutionsSubmittedCount,
  }), [
    screen, go, players, selectedCategory, roomCode, chatMessages,
    playerId, myRole, myWord, gameCategory, cards,
    votesCast, totalVoters, eliminatedPlayer, voteTied,
    currentQuestion, quizRound, quizResult, privilegeOptions, fastestPlayerId,
    winners, civilianWord, undercoverWord,
    clueRequested,
    finalists, finalDiagnosis, finalSolutions, finalSolutionVotes, finalReveal, solutionsSubmittedCount,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
