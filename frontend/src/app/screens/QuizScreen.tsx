import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Zap, Shield, HelpCircle, Trophy } from "lucide-react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { Avatar } from "../components/shared/Avatar";
import { socket } from "../services/socket";

const PRIVILEGE_META: Record<string, { icon: React.ReactNode; label: string; description: string; color: string }> = {
  points:        { icon: <Star className="w-5 h-5" />,    label: "Pass",           description: "Take your 15 points and do nothing extra",  color: "bg-yellow-50 border-yellow-300 text-yellow-700" },
  immunity:      { icon: <Shield className="w-5 h-5" />,  label: "Immunity",       description: "You cannot be eliminated next round",        color: "bg-green-50 border-green-300 text-green-700" },
  clue_request:  { icon: <HelpCircle className="w-5 h-5" />, label: "Clue Request", description: "Force another player to reveal a clue",   color: "bg-purple-50 border-purple-300 text-purple-700" },
};

export default function QuizScreen() {
  const {
    players, playerId, roomCode,
    currentQuestion, quizRound, quizResult,
    privilegeOptions, fastestPlayerId,
    eliminatedPlayer, voteTied,
  } = useGame();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [chosenPrivilege, setChosenPrivilege] = useState<string | null>(null);
  const [clueTargetId, setClueTargetId] = useState<string>("");

  const currentPlayer = players.find(p => p.id === playerId);
  const fastestPlayer = players.find(p => p.id === fastestPlayerId);
  const hasAnswered = quizResult !== null;
  const isMyPrivilege = privilegeOptions.length > 0;

  const handleAnswer = (idx: number) => {
    if (hasAnswered || selectedIndex !== null) return;
    setSelectedIndex(idx);
    socket.emit("quiz:answer", { roomCode, answerIndex: idx });
  };

  const handlePrivilege = (privilege: string) => {
    if (privilege === "clue_request" && !clueTargetId) return;
    setChosenPrivilege(privilege);
    socket.emit("quiz:choose_privilege", {
      roomCode,
      privilege,
      targetId: privilege === "clue_request" ? clueTargetId : undefined,
    });
  };

  const handleEndQuiz = () => {
    socket.emit("quiz:end", roomCode);
  };

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title={`Quiz — Round ${quizRound}`} />

      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 space-y-4">

        {/* Round / elimination context */}
        {(eliminatedPlayer || voteTied) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl px-4 py-3 border text-sm font-medium flex items-center gap-2 ${
              voteTied
                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {voteTied
              ? <><Zap className="w-4 h-4 flex-shrink-0" /> Tie — no elimination this round</>
              : <><Trophy className="w-4 h-4 flex-shrink-0" /> {eliminatedPlayer?.name} ({eliminatedPlayer?.role}) was eliminated</>
            }
          </motion.div>
        )}

        {/* Fastest answer badge */}
        <AnimatePresence>
          {fastestPlayer && (
            <motion.div
              key="fastest"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">
                ⚡ {fastestPlayer.name} answered first!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question card */}
        {currentQuestion ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <p className="text-base lg:text-lg font-bold text-foreground leading-snug">
              {currentQuestion.question}
            </p>

            <div className="grid grid-cols-1 gap-2">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedIndex === idx;
                const isCorrect = quizResult && isSelected && quizResult.correct;
                const isWrong = quizResult && isSelected && !quizResult.correct;
                return (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAnswer(idx)}
                    disabled={hasAnswered}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      isCorrect
                        ? "bg-green-100 border-green-400 text-green-800"
                        : isWrong
                          ? "bg-red-100 border-red-400 text-red-800"
                          : isSelected
                            ? "bg-primary/10 border-primary text-primary"
                            : hasAnswered
                              ? "bg-muted border-border text-muted-foreground cursor-default"
                              : "bg-muted/50 border-border hover:bg-muted hover:border-primary/40 cursor-pointer"
                    }`}
                  >
                    <span className="font-bold mr-2 text-muted-foreground">{String.fromCharCode(65 + idx)}.</span>
                    {opt}
                  </motion.button>
                );
              })}
            </div>

            {/* Result feedback */}
            <AnimatePresence>
              {quizResult && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                    quizResult.correct ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {quizResult.correct
                    ? `✅ Correct! +${quizResult.points} pts${quizResult.hasPrivilege ? " — Choose your privilege below" : ""}`
                    : "❌ Wrong answer. No points this round."}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-8 flex items-center justify-center">
            <p className="text-muted-foreground text-sm animate-pulse">Loading question…</p>
          </div>
        )}

        {/* Privilege choice — only shown to fastest correct answerer */}
        <AnimatePresence>
          {isMyPrivilege && !chosenPrivilege && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-3"
            >
              <p className="text-sm font-bold text-foreground">🎁 Choose Your Privilege</p>

              {/* Clue request: pick target player first */}
              {privilegeOptions.includes("clue_request") && (
                <select
                  value={clueTargetId}
                  onChange={e => setClueTargetId(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                >
                  <option value="">— Select player to request clue from —</option>
                  {players
                    .filter(p => p.id !== playerId && p.status !== "Eliminated")
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
              )}

              <div className="grid grid-cols-1 gap-2">
                {privilegeOptions.map(priv => {
                  const meta = PRIVILEGE_META[priv];
                  if (!meta) return null;
                  const disabled = priv === "clue_request" && !clueTargetId;
                  return (
                    <button
                      key={priv}
                      onClick={() => handlePrivilege(priv)}
                      disabled={disabled}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:opacity-80 active:scale-[0.98] ${meta.color} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {meta.icon}
                      <div className="text-left">
                        <p className="font-semibold">{meta.label}</p>
                        <p className="text-xs opacity-70">{meta.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {chosenPrivilege && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm text-green-700 font-medium"
            >
              ✅ Privilege applied: <strong>{PRIVILEGE_META[chosenPrivilege]?.label}</strong>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scoreboard snapshot */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Scores</p>
          <div className="space-y-2">
            {[...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <Avatar name={p.name} color={p.color} size="sm" />
                <span className={`flex-1 text-sm truncate ${p.status === "Eliminated" ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>
                  {p.name}
                </span>
                <span className="text-sm font-bold text-foreground">{p.score ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Host ends quiz */}
        {currentPlayer?.isHost && (
          <button
            onClick={handleEndQuiz}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
          >
            End Quiz → Next Round
          </button>
        )}
      </div>
    </div>
  );
}
