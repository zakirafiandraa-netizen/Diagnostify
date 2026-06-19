import { motion } from "motion/react";
import { Trophy } from "lucide-react";
import { useGame } from "../context/GameContext";

export default function FinalistScreen() {
  const { go } = useGame();

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0 items-center justify-center px-6 py-14 gap-6 text-center">
      <motion.div initial={{ scale:0.7, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ duration:0.5, ease:"easeOut" }}
        className="w-28 h-28 bg-orange-100 rounded-full flex items-center justify-center">
        <Trophy className="w-14 h-14 text-orange-500" />
      </motion.div>
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.3 }}>
        <h2 className="text-2xl lg:text-4xl font-bold text-foreground">You're a Finalist!</h2>
        <p className="text-sm lg:text-base text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
          You survived the voting round. Eliminated players are now casting their final votes.
        </p>
      </motion.div>
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.35, duration:0.3 }}
        className="w-full max-w-sm bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <p className="text-4xl font-bold text-blue-700 mb-1" aria-live="polite">0 / 1</p>
        <p className="text-sm text-blue-600 mb-3">Finalist votes received</p>
        <div className="h-2 bg-blue-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full w-0 bg-blue-500 rounded-full" />
        </div>
      </motion.div>
      <p className="text-xs text-muted-foreground" aria-live="polite">Waiting for eliminated players…</p>
      <button onClick={() => go("final-submissions")} className="w-full max-w-sm bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
        View Final Submissions →
      </button>
    </div>
  );
}
