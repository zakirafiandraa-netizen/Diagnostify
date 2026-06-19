import { useMemo } from "react";
import { motion } from "motion/react";
import { Wifi, WifiOff, BookOpen, Stethoscope } from "lucide-react";
import { useGame } from "../context/GameContext";
import { fadeUp, staggerList } from "../animations/presets";
import { Screen } from "../types";

export default function HomeScreen() {
  const { go } = useGame();

  const cards = useMemo(() => [
    { icon:<WifiOff className="w-6 h-6"/>, title:"Offline Mode", subtitle:"Play locally with friends in the same room", stats:["2–8 players","No internet"], cta:"Play Offline", bg:"bg-primary", shadow:"hover:shadow-primary/25", screen:"offline-players" as Screen },
    { icon:<Wifi className="w-6 h-6"/>,    title:"Online Mode",  subtitle:"Play with anyone, anywhere in real-time",    stats:["2–10 players","Real-time"],  cta:"Play Online", bg:"bg-[#0891B2]", shadow:"hover:shadow-[#0891B2]/25", badge:"Live", screen:"online-join" as Screen },
    { icon:<BookOpen className="w-6 h-6"/>,title:"Guidebook",    subtitle:"Learn all the rules, roles, and strategies",  stats:["Full guide","Tips & tricks"], cta:"Read Guide", bg:"bg-[#7C3AED]", shadow:"hover:shadow-[#7C3AED]/25", screen:"home" as Screen },
  ], []);

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0 lg:pb-14">
      {/* Hero */}
      <div className="flex flex-col items-center pt-10 pb-8 px-4 lg:pt-16 lg:pb-12 bg-gradient-to-b from-primary/10 to-transparent">
        <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ duration:0.4, ease:"easeOut" }}
          className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-2xl shadow-primary/30">
          <Stethoscope className="w-9 h-9 lg:w-11 lg:h-11 text-white" />
        </motion.div>
        <motion.h1 initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.3 }}
          className="text-2xl lg:text-4xl font-bold text-foreground tracking-tight" style={{ fontFamily:"'DM Sans',sans-serif" }}>
          Uncoverles
        </motion.h1>
        <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2, duration:0.3 }}
          className="text-sm lg:text-base text-muted-foreground mt-1.5 text-center max-w-md">
          Medical mystery — who is the undercover doctor?
        </motion.p>
      </div>

      {/* Cards */}
      <motion.div variants={staggerList} initial="initial" animate="animate"
        className="flex flex-col lg:grid lg:grid-cols-3 gap-4 px-4 lg:px-10">
        {cards.map((c) => (
          <motion.div key={c.title} variants={fadeUp}>
            <div onClick={() => go(c.screen)}
              className={`bg-card rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-sm border border-border cursor-pointer
                          hover:-translate-y-1.5 hover:shadow-xl ${c.shadow} active:scale-[0.98] transition-all duration-200`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-white ${c.bg}`}>
                  {c.icon}
                </div>
                {c.badge && (
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />{c.badge}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-foreground lg:text-lg">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-3 leading-relaxed">{c.subtitle}</p>
              <div className="flex gap-2 mb-4">
                {c.stats.map((s) => <span key={s} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{s}</span>)}
              </div>
              <button className={`w-full ${c.bg} text-white text-sm font-semibold py-2.5 lg:py-3 rounded-xl hover:opacity-90 transition-opacity`}>
                {c.cta}
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
