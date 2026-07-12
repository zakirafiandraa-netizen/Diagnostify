import { motion } from "motion/react";
import { Stethoscope, Trophy, Star } from "lucide-react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { Avatar } from "../components/shared/Avatar";
import { fadeUp, staggerList } from "../animations/presets";

export default function FinalSubmissionsScreen() {
  const { go, players, finalReveal } = useGame();

  // Sort by votes received descending so the winner is first
  const sorted = [...finalReveal].sort((a, b) => b.votesReceived - a.votesReceived);
  const topVotes = sorted[0]?.votesReceived ?? 0;

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title="Final Results" onBack={() => go("game-over")} />
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4">

        {finalReveal.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "#F3F4F6" }}>
              <Trophy className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Results not available yet.</p>
          </div>
        ) : (
          <motion.div
            variants={staggerList}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6"
          >
            {sorted.map((entry, i) => {
              const player = players.find(p => p.id === entry.playerId);
              const isWinner = entry.votesReceived === topVotes && topVotes > 0;

              return (
                <motion.div
                  key={entry.label}
                  variants={fadeUp}
                  className="rounded-2xl border shadow-sm p-4 lg:p-5 hover:shadow-lg transition-shadow"
                  style={{
                    background: isWinner ? "linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%)" : "var(--color-card, #fff)",
                    borderColor: isWinner ? "#FED7AA" : "var(--color-border, #E5E7EB)",
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center flex-shrink-0"
                      style={{ background: isWinner ? "#F97316" : "#6366F1" }}
                    >
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                    </div>
                    <Avatar
                      name={entry.playerName ?? player?.name ?? "?"}
                      color={player?.color ?? "#6366F1"}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {entry.playerName ?? player?.name ?? "Unknown"}
                        {isWinner && <span className="ml-1 text-xs text-orange-500">★ Winner</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">Solution {entry.label}</p>
                    </div>
                  </div>

                  {/* Solution text */}
                  <div className="space-y-2.5 mb-4">
                    <div className="rounded-xl p-3" style={{ background: "#F9FAFB" }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-primary" />
                        <p className="text-xs font-semibold text-foreground">Treatment Solution</p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {entry.solution ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div className="flex items-center justify-between rounded-xl p-3"
                    style={{ background: isWinner ? "#FFF7ED" : "#F3F4F6" }}>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-yellow-500" />
                      <p className="text-xs font-semibold text-foreground">
                        {entry.votesReceived} vote{entry.votesReceived !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="text-xs font-bold" style={{ color: "#F97316" }}>
                      +{entry.pointsAwarded} pts
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        <button
          onClick={() => go("game-over")}
          className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 mb-6"
        >
          See Full Leaderboard →
        </button>
      </div>
    </div>
  );
}
