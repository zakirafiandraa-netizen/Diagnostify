import { useMemo } from "react";
import { motion } from "motion/react";
import { Trophy } from "lucide-react";
import { useGame } from "../context/GameContext";
import { useOfflineGame } from "../context/OfflineGameContext";
import { Avatar } from "../components/shared/Avatar";
import { fadeUp, staggerList } from "../animations/presets";

export default function OfflineRankingScreen() {
    const { go } = useGame();
    const { offlinePlayers, civilianWord, undercoverWord, resetOfflineGame } = useOfflineGame();

    const handleHome = () => { resetOfflineGame(); go("home"); };

    const leaderboard = useMemo(
        () => [...offlinePlayers].sort((a, b) => b.score - a.score),
        [offlinePlayers]
    );

    const medals = ["🥇", "🥈", "🥉"];

    return (
        <div className="flex flex-col min-h-screen">
            <div className="bg-gradient-to-br from-[#0891B2] to-primary px-5 pt-10 pb-8 text-center">
                <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto shadow-xl">
                    <Trophy className="w-9 h-9 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white">Final Ranking</h2>
                <p className="text-white/70 text-sm mt-1">The final 3 have been decided!</p>

                <div className="grid grid-cols-2 gap-3 mt-5 max-w-xs mx-auto">
                    <div className="bg-white/15 rounded-xl p-3.5 text-center">
                        <p className="text-white/55 text-xs mb-1">Civilian Word</p>
                        <p className="text-white font-bold text-sm">{civilianWord || "—"}</p>
                    </div>
                    <div className="bg-white/15 rounded-xl p-3.5 text-center">
                        <p className="text-white/55 text-xs mb-1">Undercover Word</p>
                        <p className="text-white font-bold text-sm">{undercoverWord || "—"}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-4 py-6">
                <motion.div variants={staggerList} initial="initial" animate="animate" className="space-y-3">
                    {leaderboard.map((p, i) => (
                        <motion.div key={p.id} variants={fadeUp}
                            className={`rounded-2xl border shadow-sm p-4 ${i === 0 ? "bg-yellow-50 border-yellow-200" : "bg-card border-border"} ${p.status === "Eliminated" ? "opacity-70" : ""}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-7 text-center text-sm font-bold">{i < 3 ? medals[i] : `#${i + 1}`}</span>
                                <Avatar name={p.name} color={p.color} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground">
                                        {p.name}
                                        {p.status === "Eliminated" && <span className="ml-1 text-xs text-muted-foreground">(eliminated)</span>}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{p.role ?? "Unknown"}</p>
                                </div>
                                <span className={`text-lg font-bold ${i === 0 ? "text-yellow-600" : "text-foreground"}`}>{p.score}</span>
                            </div>
                            <div className="flex gap-2 mt-2 flex-wrap pl-10">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                                    {p.roundsSurvived} rounds × 10 = {p.roundsSurvived * 10}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                                    Quiz: {p.quizPoints}
                                </span>
                                {p.finalistBonus > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                                        Finalist: +{p.finalistBonus}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                <button
                    onClick={handleHome}
                    className="w-full mt-6 bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all"
                >
                    🏠 Back to Home
                </button>
            </div>
        </div>
    );
}