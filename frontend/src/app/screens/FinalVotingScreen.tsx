import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, CheckCircle, CircleNotch as Loader2 } from "@phosphor-icons/react";
import { useGame } from "../context/GameContext";
import { socket } from "../services/socket";

const LABEL_COLORS: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  A: { bg: "var(--color-chart-1)", border: "var(--color-chart-1)", text: "var(--color-background)", accent: "var(--color-background)" },
  B: { bg: "var(--color-chart-2)", border: "var(--color-chart-2)", text: "var(--color-background)", accent: "var(--color-background)" },
  C: { bg: "var(--color-chart-3)", border: "var(--color-chart-3)", text: "var(--color-background)", accent: "var(--color-background)" },
};

export default function FinalVotingScreen() {
  const {
    playerId, players, roomCode,
    finalSolutions, finalSolutionVotes,
  } = useGame();

  const isEliminated = players.find(p => p.id === playerId)?.status === "Eliminated";
  const [votedLabel, setVotedLabel] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = (label: string) => {
    if (hasVoted) return;
    setVotedLabel(label);
    setHasVoted(true);
    socket.emit("final:vote_solution", { roomCode, label });
  };

  const progressPct = finalSolutionVotes.total > 0
    ? (finalSolutionVotes.votesCast / finalSolutionVotes.total) * 100
    : 0;

  // ── Finalist waiting screen ──
  if (!isEliminated) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-6 py-14 gap-6 text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-28 h-28 rounded-full flex items-center justify-center bg-primary"
        >
          <Trophy className="w-14 h-14 text-primary-foreground" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-2xl font-bold text-foreground">Solutions Under Review</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
            Eliminated players are anonymously voting on the 3 solutions. The results will be revealed soon!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="w-full max-w-sm rounded-2xl border p-6 bg-card border-border"
        >
          <p className="text-4xl font-bold mb-1 text-primary">
            {finalSolutionVotes.votesCast} / {finalSolutionVotes.total}
          </p>
          <p className="text-sm mb-3 text-muted-foreground">Votes cast</p>
          <div className="h-2 rounded-full overflow-hidden bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 60 }}
            />
          </div>
        </motion.div>

        <div className="flex gap-2 flex-wrap justify-center max-w-sm">
          {["A", "B", "C"].map(label => {
            const colors = LABEL_COLORS[label]!;
            return (
              <div key={label} className="px-4 py-2 rounded-full text-xs font-bold border"
                style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}>
                Solution {label}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground animate-pulse">Waiting for all votes…</p>
      </div>
    );
  }

  // ── Eliminated player: vote screen ──
  return (
    <div className="flex flex-col min-h-screen px-5 py-10 gap-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 text-primary-foreground text-center bg-primary"
      >
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Final Vote</p>
        <h2 className="text-xl font-bold">Choose the Best Solution</h2>
        <p className="text-sm opacity-80 mt-1">Solutions are anonymous — judge by quality only</p>
      </motion.div>

      {/* Vote progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border p-3.5 flex items-center justify-between bg-card border-border"
      >
        <p className="text-xs text-muted-foreground">Votes cast</p>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 rounded-full overflow-hidden bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 80 }}
            />
          </div>
          <p className="text-sm font-bold text-foreground">
            {finalSolutionVotes.votesCast} / {finalSolutionVotes.total}
          </p>
        </div>
      </motion.div>

      {/* Solution cards */}
      <motion.div
        className="flex flex-col gap-4"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
      >
        {finalSolutions.map((entry) => {
          const colors = LABEL_COLORS[entry.label] ?? LABEL_COLORS["A"]!;
          const isSelected = votedLabel === entry.label;

          return (
            <motion.button
              key={entry.label}
              id={`solution-card-${entry.label}`}
              onClick={() => handleVote(entry.label)}
              disabled={hasVoted}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={!hasVoted ? { scale: 0.98 } : undefined}
              className="text-left rounded-2xl border-2 p-5 transition-all shadow-sm hover:shadow-lg disabled:cursor-not-allowed"
              style={{
                background: isSelected ? colors.bg : "var(--color-card, #fff)",
                borderColor: isSelected ? colors.accent : (hasVoted ? "var(--color-muted)" : colors.border),
                opacity: hasVoted && !isSelected ? 0.55 : 1,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base"
                  style={{ background: colors.bg, color: colors.accent, border: `2px solid ${colors.border}` }}>
                  {entry.label}
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <CheckCircle className="w-5 h-5" style={{ color: colors.accent }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {entry.solution ?? "No solution text."}
              </p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* After voting */}
      <AnimatePresence>
        {hasVoted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 rounded-xl border border-primary py-3 px-4 bg-primary/10"
          >
            <CheckCircle className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-primary">
              You voted for Solution {votedLabel}!
            </p>
            <Loader2 className="w-4 h-4 animate-spin ml-1 text-primary" />
          </motion.div>
        )}
      </AnimatePresence>

      {!hasVoted && (
        <p className="text-xs text-muted-foreground text-center">Tap a solution card to cast your vote</p>
      )}
    </div>
  );
}
