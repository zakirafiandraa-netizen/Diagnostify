import { useState } from "react";
import { motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { StepBar } from "../components/shared/StepBar";

import { DualButtonBar } from "../components/shared/InfoBanner";
import { AVATARS, COLORS } from "../constants";
import { fadeUp, staggerList } from "../animations/presets";

export default function AddPlayersScreen() {
  const { go, players, setPlayers } = useGame();
  const [name, setName] = useState("");
  const [selAvatar, setSelAvatar] = useState(0);

  const add = () => {
    if (!name.trim() || players.length >= 8) return;
    setPlayers([...players, { 
      id: Date.now().toString(), 
      name: name.trim(), 
      avatar: AVATARS[selAvatar], 
      color: COLORS[players.length % COLORS.length] 
    }]);
    setName("");
  };

  const n = players.length;
  const undercovers = Math.floor(n / 4);
  const mrWhite = n >= 4 ? 1 : 0;
  const civilians = n - undercovers - mrWhite;

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title="Add Players" onBack={() => go("home")} />
      <StepBar current={0} />

      <div className="flex-1 flex flex-col lg:flex-row lg:gap-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 space-y-4 lg:border-r lg:border-border">
          <div className="bg-card rounded-2xl p-4 lg:p-6 border border-border shadow-sm">
            <label className="text-sm font-semibold text-foreground block mb-2" htmlFor="player-name">Player Name</label>
            <div className="flex gap-2">
              <input id="player-name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key==="Enter" && add()}
                placeholder="Enter name…"
                className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground" />
              <button onClick={add} className="bg-primary text-white px-4 py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all" aria-label="Add player">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Choose avatar</p>
              <div className="flex gap-2 flex-wrap">
                {AVATARS.map((av, i) => (
                  <button key={i} onClick={() => setSelAvatar(i)} aria-label={`Select avatar ${av}`}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${selAvatar === i ? "bg-primary/15 ring-2 ring-primary" : "bg-muted hover:bg-muted/60"}`}>
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-muted/60 rounded-xl p-3 flex gap-2 justify-center flex-wrap">
            {[
              { label:"Civilian", count:civilians, color:"#0D9488" },
              { label:"Undercover", count:undercovers, color:"#F97316" },
              { label:"Mr. White", count:mrWhite, color:"#7C3AED" },
            ].map((r) => (
              <span key={r.label} className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{ backgroundColor:r.color+"20", color:r.color }}>
                {r.label}: {r.count}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:w-80 xl:w-96 overflow-y-auto px-4 lg:px-6 py-4">
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm h-full lg:h-auto">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-foreground">Players ({players.length}/8)</span>
            </div>
            <motion.div variants={staggerList} initial="initial" animate="animate" className="space-y-1">
              {players.map((p, i) => (
                <motion.div key={p.id} variants={fadeUp}
                  className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor:p.color+"22" }}>{p.avatar || "🧑"}</div>
                  <span className="flex-1 text-sm font-medium text-foreground">{p.name}</span>
                  <button onClick={() => setPlayers(players.filter((_,idx) => idx!==i))} aria-label={`Remove ${p.name}`}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <DualButtonBar onBack={() => go("home")} onNext={() => go("offline-category")} nextDisabled={players.length < 3} />
    </div>
  );
}
