// ── Animation presets ─────────────────────────────────────────────
import type { Variants } from "motion/react";

export const pageFade: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.14, ease: "easeIn" as const } },
};

export const staggerList: Variants = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.27, ease: "easeOut" as const } },
};
