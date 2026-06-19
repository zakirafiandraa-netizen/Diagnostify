import { motion } from "motion/react";
import { Users, Crown } from "lucide-react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { Avatar } from "../components/shared/Avatar";
import { fadeUp, staggerList } from "../animations/presets";

export default function LobbyPlayersScreen() {
  const { go, players } = useGame();

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title="Waiting Room" onBack={() => go("lobby-main")}
        action={<button onClick={() => go("choose-role")} className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90">Start</button>} />
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 space-y-4">
        <div className="lg:max-w-3xl lg:mx-auto space-y-4">
          <div className="bg-card rounded-2xl p-4 lg:p-6 border border-border shadow-sm">
            <h4 className="font-semibold text-sm mb-3">Players ({players.length} / 8)</h4>
            <motion.div variants={staggerList} initial="initial" animate="animate"
              className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {players.map((p, i) => (
                <motion.div key={p.id} variants={fadeUp}
                  className="flex items-center gap-2.5 bg-muted/50 rounded-xl p-2.5 hover:bg-muted/80 transition-colors">
                  <Avatar name={p.name} color={p.color} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">#{i+1}</p>
                  </div>
                  {i===0 && <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                </motion.div>
              ))}
              {Array.from({ length: 8 - players.length }, (_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-2.5 bg-muted/30 rounded-xl p-2.5 border border-dashed border-border">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Waiting…</p>
                </div>
              ))}
            </motion.div>
          </div>
          <div className="bg-card rounded-2xl p-4 lg:p-6 border border-border shadow-sm">
            <h4 className="font-semibold text-sm mb-3">Quick Rules</h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-3">
              {[
                { step:"1", title:"Get Your Role", desc:"Each player gets a secret role and disease word.", color:"#3B82F6" },
                { step:"2", title:"Discuss", desc:"Give clues about your disease without naming it.", color:"#0D9488" },
                { step:"3", title:"Vote", desc:"Eliminate who you think is the Undercover doctor.", color:"#7C3AED" },
              ].map((r) => (
                <div key={r.step} className="flex gap-3 p-3 rounded-xl" style={{ backgroundColor:r.color+"10" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor:r.color }}>{r.step}</div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
