import { motion } from "motion/react";
import { Stethoscope, Trophy } from "lucide-react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { Avatar } from "../components/shared/Avatar";
import { ChatSection } from "../components/shared/ChatComponents";
import { fadeUp, staggerList } from "../animations/presets";
import { PrimaryButtonBar } from "../components/shared/InfoBanner";

export default function FinalSubmissionsScreen() {
  const { go, players, chatMessages } = useGame();
  
  // Safe access using optional chaining
  const finalists = [
    { player: players[0] || { name: "Budi", color: "#0D9488" }, plan: "Prescribed beta-blockers and rest, focusing on reducing cardiac load and preventing further arrhythmic episodes.", innovation: "Using wearable ECG patches to detect irregular rhythms in real-time and alert patients automatically." },
    { player: players[2] || { name: "Andi", color: "#F97316" }, plan: "Recommended dietary changes, aerobic exercise, and scheduled cardioversion for persistent arrhythmia.", innovation: "A mobile app that tracks HRV over time and flags anomalies to cardiologists remotely." },
    { player: players[4] || { name: "Reza", color: "#3B82F6" }, plan: "Initiated anticoagulant therapy (apixaban) and referred for electrophysiology specialist follow-up.", innovation: "AI-assisted 12-lead ECG diagnostic tool for rapid arrhythmia classification at point of care." },
  ];

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title="Final Submissions" onBack={() => go("finalist")} />
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4">
        <motion.div variants={staggerList} initial="initial" animate="animate"
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6">
          {finalists.map((f, i) => (
            <motion.div key={i} variants={fadeUp}
              className="bg-card rounded-2xl border border-border shadow-sm p-4 lg:p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{i+1}</div>
                <Avatar name={f.player.name} color={f.player.color} size="sm" />
                <div>
                  <p className="text-sm font-bold text-foreground">{f.player.name}</p>
                  <p className="text-xs text-muted-foreground">Finalist</p>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="bg-muted/60 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5"><Stethoscope className="w-3.5 h-3.5 text-primary" /><p className="text-xs font-semibold text-foreground">Treatment Plan</p></div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.plan}</p>
                </div>
                <div className="bg-muted/60 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5"><Trophy className="w-3.5 h-3.5 text-orange-500" /><p className="text-xs font-semibold text-foreground">Medical Innovation</p></div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.innovation}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        <ChatSection messages={chatMessages.slice(2)} />
      </div>
      <PrimaryButtonBar onClick={() => go("game-over")} label="See Results →" />
    </div>
  );
}
