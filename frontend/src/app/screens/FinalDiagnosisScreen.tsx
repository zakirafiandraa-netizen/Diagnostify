import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FirstAid as Stethoscope, Trophy, Clock, CheckCircle } from "@phosphor-icons/react";
import { useGame } from "../context/GameContext";
import { socket } from "../services/socket";

export default function FinalDiagnosisScreen() {
  const {
    playerId, players, roomCode,
    finalists, finalDiagnosis,
    solutionsSubmittedCount,
  } = useGame();

  const isFinalist = finalists.includes(playerId);
  const totalFinalists = finalists.length;

  const [solution, setSolution] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = solution.trim();
    if (!trimmed) {
      setError("Please write your solution before submitting.");
      return;
    }
    socket.emit("final:submit_solution", { roomCode, solution: trimmed });
    setSubmitted(true);
    setError("");
  };

  // ── Eliminated / non-finalist waiting screen ──
  if (!isFinalist) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-6 py-14 gap-6 text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-28 h-28 rounded-full flex items-center justify-center bg-primary"
        >
          <Clock className="w-14 h-14 text-primary-foreground" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-foreground">Final Round</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
            The 3 finalists are writing their diagnosis solutions. You'll vote on them when they're done.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="w-full max-w-sm rounded-2xl border p-6 bg-card border-border"
        >
          <p className="text-4xl font-bold mb-1 text-primary">
            {solutionsSubmittedCount} / {totalFinalists}
          </p>
          <p className="text-sm mb-3 text-muted-foreground">Solutions submitted</p>
          <div className="h-2 rounded-full overflow-hidden bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${totalFinalists > 0 ? (solutionsSubmittedCount / totalFinalists) * 100 : 0}%` }}
              transition={{ type: "spring", stiffness: 60 }}
            />
          </div>
        </motion.div>

        {/* Finalist names */}
        <div className="flex flex-wrap justify-center gap-2 max-w-sm">
          {finalists.map(fId => {
            const p = players.find(pl => pl.id === fId);
            return (
              <div key={fId} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground"
              >
                <Trophy className="w-3 h-3 text-yellow-500" />
                {p?.name ?? "Finalist"}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground animate-pulse">Waiting for finalists to submit…</p>
      </div>
    );
  }

  // ── Finalist: write solution ──
  return (
    <div className="flex flex-col min-h-screen px-5 py-10 gap-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl p-5 text-primary-foreground text-center bg-primary"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Trophy className="w-5 h-5" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">You're a Finalist</p>
        </div>
        <h2 className="text-xl font-bold">Final Diagnosis</h2>
        <p className="text-sm opacity-80 mt-1">Write your best solution for the case below</p>
      </motion.div>

      {/* Case word */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="rounded-2xl border p-5 bg-card border-border"
      >
        <div className="flex items-center gap-2 mb-2">
          <Stethoscope className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Medical Condition to Diagnose
          </p>
        </div>
        <p className="text-2xl font-bold text-primary">{finalDiagnosis || "—"}</p>
      </motion.div>

      {/* Submission form or waiting state */}
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="flex flex-col gap-3 flex-1"
          >
            <label className="text-sm font-semibold text-foreground">Your Treatment Solution</label>
            <textarea
              id="final-solution-input"
              rows={6}
              value={solution}
              onChange={e => { setSolution(e.target.value); setError(""); }}
              placeholder="Describe your diagnosis, treatment plan, and any innovative approaches…"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
            />
            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
            <div className="text-xs text-muted-foreground text-right">{solution.trim().length} characters</div>

            {/* Submission progress */}
            <div className="rounded-xl border p-3.5 flex items-center justify-between bg-card border-border">
              <p className="text-xs text-muted-foreground">Submissions received</p>
              <p className="text-sm font-bold text-foreground">
                {solutionsSubmittedCount} / {totalFinalists}
              </p>
            </div>

            <button
              id="submit-solution-btn"
              onClick={handleSubmit}
              disabled={!solution.trim()}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground ${solution.trim() ? "bg-primary text-primary-foreground" : ""}`}
            >
              Submit Solution →
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-5 flex-1 pt-4"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/10">
              <CheckCircle className="w-9 h-9 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">Solution Submitted!</h3>
              <p className="text-sm text-muted-foreground mt-1">Waiting for other finalists…</p>
            </div>

            <div className="w-full max-w-sm rounded-2xl border p-5 bg-card border-border">
              <p className="text-4xl font-bold mb-1 text-center text-primary">
                {solutionsSubmittedCount} / {totalFinalists}
              </p>
              <p className="text-sm text-center mb-3 text-muted-foreground">Solutions submitted</p>
              <div className="h-2 rounded-full overflow-hidden bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: `${totalFinalists > 0 ? (solutionsSubmittedCount / totalFinalists) * 100 : 0}%` }}
                  transition={{ type: "spring", stiffness: 60 }}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground animate-pulse">
              Voting will begin when all finalists submit
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
