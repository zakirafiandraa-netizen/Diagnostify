import { useState } from "react";
import { motion } from "motion/react";
import { FirstAid as Stethoscope, Eye, EyeClosed as EyeOff } from "@phosphor-icons/react";
import { useGame } from "../context/GameContext";
import { useOfflineGame } from "../context/OfflineGameContext";
import { fadeUp, staggerList } from "../animations/presets";

export default function OfflineChooseRoleScreen() {
    const { go } = useGame();
    const { offlinePlayers, cards, pickCard, allCardsPicked, goToDiscussion } = useOfflineGame();

    const [ready, setReady] = useState(false);
    const [revealedWord, setRevealedWord] = useState<string | null>(null);

    const pickedCount = cards.filter(c => c.pickedBy).length;
    const currentPlayer = offlinePlayers[pickedCount];

    const handlePick = (cardId: number) => {
        if (!currentPlayer) return;
        const word = pickCard(currentPlayer.id, cardId);
        setRevealedWord(word);
    };

    const handleHideAndPass = () => {
        setRevealedWord(null);
        setReady(false);
    };

    if (allCardsPicked) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center px-6 gap-6 text-center">
                <h2 className="text-2xl font-bold text-foreground">All Roles Assigned!</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Everyone has secretly seen their role. Time to start discussing.
                </p>
                <button
                    onClick={() => { goToDiscussion(); go("offline-discussion"); }}
                    className="w-full max-w-sm bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                >
                    Start Discussion →
                </button>
            </div>
        );
    }

    // ── Pass-device cover ──
    if (!ready) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center px-6 gap-6 text-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <EyeOff className="w-10 h-10 text-muted-foreground" />
                </motion.div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">Pass the device to</h2>
                    <p className="text-2xl font-bold text-primary mt-1">{currentPlayer?.name}</p>
                    <p className="text-sm text-muted-foreground mt-2">Make sure no one else can see the screen.</p>
                </div>
                <button
                    onClick={() => setReady(true)}
                    className="w-full max-w-sm bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                >
                    I'm {currentPlayer?.name} — Show My Cards
                </button>
            </div>
        );
    }

    // ── Revealed word (after picking) ──
    if (revealedWord !== null) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center px-6 gap-6 text-center">
                <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <Eye className="w-10 h-10 text-primary" />
                </motion.div>
                <div>
                    <p className="text-sm text-muted-foreground">Your word is</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{revealedWord}</p>
                </div>
                <button
                    onClick={handleHideAndPass}
                    className="w-full max-w-sm bg-destructive text-white py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all"
                >
                    Got It — Hide & Pass
                </button>
            </div>
        );
    }

    // ── Card grid ──
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex flex-col items-center pt-8 pb-6 px-4 bg-gradient-to-b from-primary/10 to-transparent">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-xl shadow-primary/30">
                    <Stethoscope className="w-7 h-7 text-white" />
                </div>
                <h2 className="font-bold text-xl text-foreground">{currentPlayer?.name}, choose a card</h2>
                <p className="text-sm text-muted-foreground mt-1.5">{pickedCount} of {offlinePlayers.length} chosen</p>
            </div>

            <div className="flex-1 px-4 py-4">
                <motion.div variants={staggerList} initial="initial" animate="animate"
                    className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                    {cards.map((card, i) => {
                        const isTaken = !!card.pickedBy;
                        return (
                            <motion.button key={card.id} variants={fadeUp}
                                onClick={() => !isTaken && handlePick(card.id)}
                                disabled={isTaken}
                                className={`rounded-2xl border-2 p-6 flex flex-col items-center gap-3 transition-all duration-200 ${isTaken
                                        ? "bg-muted border-border/50 opacity-40 cursor-not-allowed"
                                        : "bg-card border-border hover:border-primary/50 hover:shadow-xl hover:-translate-y-1.5 active:scale-95"
                                    }`}
                            >
                                <span className="text-xs text-muted-foreground font-mono self-end">#{i + 1}</span>
                                <Stethoscope className="w-10 h-10 text-primary/30" />
                                <span className="text-xs font-semibold text-primary">
                                    {isTaken ? "Taken" : "Click to pick"}
                                </span>
                            </motion.button>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}