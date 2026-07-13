import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Shield, Question as HelpCircle, User, CheckCircle as CheckCircle2, XCircle, House as Home, Chat as MessageSquare } from "@phosphor-icons/react";
import { useGame } from "../context/GameContext";
import { useOfflineGame } from "../context/OfflineGameContext";
import { Avatar } from "../components/shared/Avatar";

export default function OfflineQuizScreen() {
    const { go } = useGame();
    const {
        offlinePlayers,
        quizQueue,
        currentQuizTurn,
        quizStarted,
        privilegePendingFor,
        startQuizForCurrentPlayer,
        submitQuizAnswer,
        choosePrivilege,
        phase,
        round,
        resetOfflineGame,
    } = useOfflineGame();

    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [result, setResult] = useState<{ correct: boolean; points: number; hasPrivilege: boolean } | null>(null);
    const [clueTargetId, setClueTargetId] = useState<string>("");
    const [confirmEnd, setConfirmEnd] = useState(false);

    // Reset local state when turn changes
    useEffect(() => {
        if (!quizStarted) {
            setSelectedIndex(null);
            setResult(null);
            setClueTargetId("");
        }
    }, [quizStarted, currentQuizTurn]);

    const handleAnswer = (idx: number) => {
        if (selectedIndex !== null) return;
        setSelectedIndex(idx);
        const res = submitQuizAnswer(idx);
        setResult(res);
    };

    const handleEndGame = () => {
        resetOfflineGame();
        go("home");
    };

    const EndGameModal = () => (
        confirmEnd ? (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6">
                <div className="bg-card rounded-2xl p-6 shadow-xl w-full max-w-sm space-y-4">
                    <h3 className="text-lg font-bold text-foreground">End Game?</h3>
                    <p className="text-sm text-muted-foreground">This will discard the current game and return to home. No ranking will be shown.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setConfirmEnd(false)} className="flex-1 py-2.5 rounded-xl bg-muted text-foreground font-medium text-sm">Cancel</button>
                        <button onClick={handleEndGame} className="flex-1 py-2.5 rounded-xl bg-destructive text-white font-bold text-sm">End Game</button>
                    </div>
                </div>
            </div>
        ) : null
    );

    const EndGameBtn = () => (
        <button
            onClick={() => setConfirmEnd(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
        >
            <Home className="w-3.5 h-3.5" />
            End Game
        </button>
    );

    // ── Round over ──────────────────────────────────────────────────
    const isRoundOver = quizQueue.length === 0 && !privilegePendingFor && !currentQuizTurn && !quizStarted;
    if (isRoundOver) {
        return (
            <div className="flex flex-col min-h-screen px-4 py-8 gap-6 justify-center items-center text-center">
                <EndGameModal />
                <div className="absolute top-4 right-4"><EndGameBtn /></div>
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-2" />
                <h2 className="text-3xl font-bold text-foreground">Quiz Finished!</h2>
                <p className="text-muted-foreground max-w-sm">
                    Everyone has taken their turn. Let's see who survived and check the scores.
                </p>
                <button
                    onClick={() => {
                        if (phase === "ranking") go("offline-ranking");
                        else go("offline-discussion");
                    }}
                    className="w-full max-w-sm bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all mt-4"
                >
                    {phase === "ranking" ? "See Final Ranking →" : `Start Round ${round} →`}
                </button>
            </div>
        );
    }

    // ── Privilege Selection (alive player, fastest correct) ─────────
    if (privilegePendingFor) {
        const pPlayer = offlinePlayers.find(p => p.id === privilegePendingFor);
        const alivePlayers = offlinePlayers.filter(p => p.status === "Alive" && p.id !== privilegePendingFor);

        return (
            <div className="flex flex-col min-h-screen px-4 py-8 gap-4">
                <EndGameModal />
                <div className="flex justify-end"><EndGameBtn /></div>

                <div className="flex flex-col items-center text-center gap-2 py-4">
                    <Star className="w-14 h-14 text-yellow-500 mb-2" />
                    <h2 className="text-2xl font-bold text-foreground">⚡ {pPlayer?.name} answered first!</h2>
                    <p className="text-muted-foreground">Choose your reward for this round:</p>
                </div>

                <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto w-full">
                    {/* Points */}
                    <button
                        onClick={() => choosePrivilege("points")}
                        className="bg-yellow-50 border border-yellow-200 p-5 rounded-2xl flex items-center gap-4 hover:bg-yellow-100 transition-colors text-left"
                    >
                        <Star className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                        <div>
                            <p className="font-bold text-yellow-800">+15 Bonus Points</p>
                            <p className="text-xs text-yellow-700 mt-0.5">Added directly to your score</p>
                        </div>
                    </button>

                    {/* Immunity */}
                    <button
                        onClick={() => choosePrivilege("immunity")}
                        className="bg-green-50 border border-green-200 p-5 rounded-2xl flex items-center gap-4 hover:bg-green-100 transition-colors text-left"
                    >
                        <Shield className="w-8 h-8 text-green-600 flex-shrink-0" />
                        <div>
                            <p className="font-bold text-green-800">Immunity</p>
                            <p className="text-xs text-green-700 mt-0.5">Cannot be eliminated next round</p>
                        </div>
                    </button>

                    {/* Clue Request */}
                    <div className="bg-purple-50 border border-purple-200 p-5 rounded-2xl space-y-3">
                        <div className="flex items-center gap-4">
                            <MessageSquare className="w-8 h-8 text-purple-600 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-purple-800">Clue Request</p>
                                <p className="text-xs text-purple-700 mt-0.5">Force a player to give an extra clue next discussion round</p>
                            </div>
                        </div>
                        {alivePlayers.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-purple-800">Choose a target:</p>
                                <div className="flex flex-wrap gap-2">
                                    {alivePlayers.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setClueTargetId(p.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                                clueTargetId === p.id
                                                    ? "bg-purple-600 text-white"
                                                    : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                                            }`}
                                        >
                                            <Avatar name={p.name} color={p.color} size="sm" />
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => clueTargetId && choosePrivilege("clue_request", clueTargetId)}
                                    disabled={!clueTargetId}
                                    className="w-full py-2 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Request Clue from {offlinePlayers.find(p => p.id === clueTargetId)?.name ?? "…"}
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-purple-600">No other alive players to target.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Waiting for player to confirm ready ─────────────────────────
    if (!quizStarted || !currentQuizTurn) {
        const nextPlayerId = quizQueue[0];
        const nextPlayer = offlinePlayers.find(p => p.id === nextPlayerId);

        return (
            <div className="flex flex-col min-h-screen px-4 py-8 gap-6 justify-center items-center text-center">
                <EndGameModal />
                <div className="absolute top-4 right-4"><EndGameBtn /></div>

                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <HelpCircle className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Next Up: {nextPlayer?.name}</h2>
                <p className="text-muted-foreground max-w-sm">
                    Pass the device to <strong>{nextPlayer?.name}</strong>. Answer correctly to earn points!{" "}
                    The first correct answer from an alive player earns a special privilege.
                </p>

                <button
                    onClick={startQuizForCurrentPlayer}
                    className="w-full max-w-sm bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all mt-4"
                >
                    I'm {nextPlayer?.name} — Start Quiz
                </button>
            </div>
        );
    }

    // ── Active Quiz Turn ────────────────────────────────────────────
    const currentPlayer = offlinePlayers.find(p => p.id === currentQuizTurn.playerId);

    return (
        <div className="flex flex-col min-h-screen px-4 py-6 gap-4">
            <EndGameModal />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{currentPlayer?.name}'s Turn</span>
                    {currentPlayer?.status === "Eliminated" && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Eliminated</span>
                    )}
                </div>
                <EndGameBtn />
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4 max-w-lg mx-auto w-full">
                <p className="text-lg font-bold text-foreground leading-snug">
                    {currentQuizTurn.question}
                </p>

                <div className="grid grid-cols-1 gap-2">
                    {currentQuizTurn.shuffledOptions.map((opt, idx) => {
                        const isSelected = selectedIndex === idx;
                        const isCorrect = result && isSelected && result.correct;
                        const isWrong = result && isSelected && !result.correct;

                        return (
                            <motion.button
                                key={idx}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleAnswer(idx)}
                                disabled={selectedIndex !== null}
                                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                    isCorrect ? "bg-green-100 border-green-400 text-green-800"
                                    : isWrong ? "bg-red-100 border-red-400 text-red-800"
                                    : isSelected ? "bg-primary/10 border-primary text-primary"
                                    : selectedIndex !== null ? "bg-muted border-border text-muted-foreground cursor-default opacity-50"
                                    : "bg-muted/50 border-border hover:bg-muted hover:border-primary/40 cursor-pointer"
                                }`}
                            >
                                <span className="font-bold mr-2 text-muted-foreground">{String.fromCharCode(65 + idx)}.</span>
                                {opt}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Result feedback */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            className={`rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
                                result.correct
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                        >
                            {result.correct
                                ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                : <XCircle className="w-5 h-5 flex-shrink-0" />}
                            <span>
                                {result.correct
                                    ? result.hasPrivilege
                                        ? "✅ Correct & First! Choose your privilege…"
                                        : `✅ Correct! +${result.points} pts`
                                    : "❌ Wrong answer. No points this round."}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex-1" />

            {result && !result.hasPrivilege && (
                <button
                    onClick={() => {
                        setSelectedIndex(null);
                        setResult(null);
                    }}
                    className="w-full max-w-sm mx-auto bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all"
                >
                    Next Player →
                </button>
            )}
        </div>
    );
}