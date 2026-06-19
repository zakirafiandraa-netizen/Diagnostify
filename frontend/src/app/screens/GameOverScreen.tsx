import { useMemo } from "react";
import { motion } from "motion/react";
import { Trophy } from "lucide-react";
import { useGame } from "../context/GameContext";
import { Avatar } from "../components/shared/Avatar";
import { fadeUp, staggerList } from "../animations/presets";

export default function GameOverScreen() {
  const { go, players } = useGame();
  
  // Memoize the sorting of the leaderboard
  const leaderboard = useMemo(() => {
    return [...players].sort((a,b) => (b.score ?? 0) - (a.score ?? 0));
  }, [players]);

  const medals = ["🥇","🥈","🥉"];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:min-h-0">
      <div className="lg:w-2/5 lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden flex-shrink-0
                      bg-gradient-to-br from-[#0891B2] to-primary px-5 pt-10 pb-8 lg:flex lg:flex-col lg:justify-center">
        <div className="flex flex-col items-center text-center">
          <motion.div initial={{ scale:0.7, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ duration:0.5 }}
            className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 shadow-xl">
            <Trophy className="w-9 h-9 text-white" />
          </motion.div>
          <motion.h2 initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15, duration:0.3 }}
            className="text-2xl lg:text-3xl font-bold text-white">Game Over!</motion.h2>
          <div className="mt-2 bg-white/25 px-4 py-1.5 rounded-full">
            <span className="text-white font-semibold text-sm">🏆 Civilian Menang!</span>
          </div>
          <p className="text-white/60 text-xs mt-2">All undercovers have been eliminated</p>
          <div className="grid grid-cols-2 gap-3 mt-5 w-full max-w-xs">
            {[{ label:"Civilian Word", word:"Aritmia" },{ label:"Undercover Word", word:"Denyut Nadi" }].map((w) => (
              <div key={w.label} className="bg-white/15 rounded-xl p-3.5 text-center">
                <p className="text-white/55 text-xs mb-1">{w.label}</p>
                <p className="text-white font-bold text-sm">{w.word}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 lg:px-8 py-6 overflow-y-auto">
        <h4 className="font-bold text-base lg:text-xl mb-4">Leaderboard</h4>
        <motion.div variants={staggerList} initial="initial" animate="animate" className="space-y-2 lg:space-y-3">
          {leaderboard.map((p, i) => (
            <motion.div key={p.id} variants={fadeUp}
              className={`flex items-center gap-3 p-3 lg:p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all ${i===0 ? "bg-yellow-50 border-yellow-200" : "bg-card border-border"}`}>
              <span className="w-7 text-center text-sm font-bold">{i<3 ? medals[i] : `#${i+1}`}</span>
              <Avatar name={p.name} color={p.color} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                    backgroundColor: p.role==="Civilian" ? "#0D948815" : p.role==="Undercover" ? "#F9731615" : "#7C3AED15",
                    color: p.role==="Civilian" ? "#0D9488" : p.role==="Undercover" ? "#F97316" : "#7C3AED",
                  }}>{p.role || "Unknown"}</span>
                  <span className="text-xs text-muted-foreground truncate hidden lg:block">{p.breakdown || "-"}</span>
                </div>
              </div>
              <span className={`text-lg font-bold flex-shrink-0 ${i===0 ? "text-yellow-600" : "text-foreground"}`}>{p.score ?? 0}</span>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => go("home")} className="flex-1 border border-border text-foreground py-3 rounded-xl font-semibold text-sm hover:bg-muted/50 transition-colors">🏠 Home</button>
          <button onClick={() => go("home")} className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-md shadow-primary/20">🔄 Play Again</button>
        </div>
      </div>
    </div>
  );
}
