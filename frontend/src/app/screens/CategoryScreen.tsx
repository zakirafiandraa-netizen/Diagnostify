import { motion } from "motion/react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { StepBar } from "../components/shared/StepBar";
import { DualButtonBar } from "../components/shared/InfoBanner";
import { CATEGORIES } from "../constants";
import { fadeUp, staggerList } from "../animations/presets";

export default function CategoryScreen() {
  const { go, selectedCategory, setSelectedCategory } = useGame();

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title="Disease Category" onBack={() => go("offline-players")} />
      <StepBar current={1} />
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4">
        <p className="text-sm text-muted-foreground mb-4">Select a disease category for this round.</p>
        <motion.div variants={staggerList} initial="initial" animate="animate"
          className="grid grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3"
          role="tablist">
          {CATEGORIES.map((cat) => (
            <motion.button key={cat} variants={fadeUp} onClick={() => setSelectedCategory(cat)}
              role="tab" aria-selected={selectedCategory === cat}
              className={`rounded-xl p-3 lg:p-4 text-xs lg:text-sm font-semibold text-center transition-all border active:scale-95 ${
                selectedCategory === cat
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-sm"}`}>
              🩺 {cat}
            </motion.button>
          ))}
        </motion.div>
      </div>
      <DualButtonBar onBack={() => go("offline-players")} onNext={() => go("offline-summary")} />
    </div>
  );
}
