import { useState, useMemo } from "react";
import { Minus, Plus, EyeOff, AlertCircle, Home } from "lucide-react";
import { useGame } from "../context/GameContext";
import { useOfflineGame } from "../context/OfflineGameContext";
import { Avatar } from "../components/shared/Avatar";
import { InfoBanner } from "../components/shared/InfoBanner";

export default function OfflineVotingScreen() {
    const { go } = useGame();
    const { offlinePlayers, voteTally, setVoteTally, resolveVoting, resetOfflineGame } = useOfflineGame();
    const [confirmEnd, setConfirmEnd] = useState(false);

    const alivePlayers = offlinePlayers.filter(p => p.status === "Alive");
    const totalVoters = alivePlayers.length;               // each alive player casts exactly 1 vote
    const maxPerPlayer = totalVoters - 1;                  // can't vote for yourself

    const totalVotesCast = useMemo(
        () => alivePlayers.reduce((sum, p) => sum + (voteTally[p.id] ?? 0), 0),
        [alivePlayers, voteTally]
    );

    const votesRemaining = totalVoters - totalVotesCast;

    // Validation
    const errors: string[] = [];
    if (totalVotesCast !== totalVoters) {
        errors.push(
            totalVotesCast < totalVoters
                ? `${votesRemaining} vote${votesRemaining !== 1 ? "s" : ""} still unassigned — every player must vote once.`
                : `Too many votes! You entered ${totalVotesCast} but only ${totalVoters} players are voting.`
        );
    }
    alivePlayers.forEach(p => {
        const v = voteTally[p.id] ?? 0;
        if (v > maxPerPlayer) {
            errors.push(`${p.name} can receive at most ${maxPerPlayer} vote${maxPerPlayer !== 1 ? "s" : ""} (can't vote for themselves).`);
        }
    });

    const canConfirm = errors.length === 0 && totalVotesCast === totalVoters;

    const handleIncrement = (playerId: string) => {
        const currentForPlayer = voteTally[playerId] ?? 0;
        if (votesRemaining <= 0) return;                        // budget exhausted
        if (currentForPlayer >= maxPerPlayer) return;           // per-player cap
        setVoteTally(playerId, currentForPlayer + 1);
    };

    const handleResolve = () => {
        if (!canConfirm) return;
        resolveVoting();
        go("offline-quiz");
    };

    const handleEndGame = () => {
        resetOfflineGame();
        go("home");
    };

    return (
        <div className="flex flex-col min-h-screen px-4 py-6 gap-4">
            {/* Top bar with end game */}
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-muted-foreground">
                    Votes: <span className={totalVotesCast > totalVoters ? "text-destructive" : "text-foreground"}>{totalVotesCast}</span> / {totalVoters}
                </div>
                <button
                    onClick={() => setConfirmEnd(true)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
                >
                    <Home className="w-3.5 h-3.5" />
                    End Game
                </button>
            </div>

            {/* Confirm end dialog */}
            {confirmEnd && (
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
            )}

            <div className="text-center py-2">
                <EyeOff className="w-10 h-10 text-destructive mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-foreground">Host: Enter the Votes</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    Everyone covers their eyes. Each of the {totalVoters} players raises a hand to vote.
                    Enter how many votes each player received.
                </p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm p-2 space-y-1">
                {alivePlayers.map(p => {
                    const votes = voteTally[p.id] ?? 0;
                    const atPlayerCap = votes >= maxPerPlayer;
                    const budgetExhausted = votesRemaining <= 0;
                    const canAdd = !atPlayerCap && !budgetExhausted;

                    return (
                        <div key={p.id} className="flex items-center gap-3 py-2 px-2 rounded-xl">
                            <Avatar name={p.name} color={p.color} size="sm" />
                            <span className="flex-1 text-sm font-medium text-foreground">{p.name}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setVoteTally(p.id, votes - 1)}
                                    disabled={votes <= 0}
                                    className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/60 flex items-center justify-center disabled:opacity-30"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className={`w-6 text-center text-sm font-bold ${votes > maxPerPlayer ? "text-destructive" : "text-foreground"}`}>
                                    {votes}
                                </span>
                                <button
                                    onClick={() => handleIncrement(p.id)}
                                    disabled={!canAdd}
                                    className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/60 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Validation errors */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
                    {errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-700 flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            {err}
                        </p>
                    ))}
                </div>
            )}

            {/* Progress bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${totalVotesCast > totalVoters ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${Math.min(100, (totalVotesCast / totalVoters) * 100)}%` }}
                    />
                </div>
                <span className={`text-xs font-semibold tabular-nums ${totalVotesCast > totalVoters ? "text-destructive" : "text-muted-foreground"}`}>
                    {totalVotesCast}/{totalVoters}
                </span>
            </div>

            <InfoBanner
                color="red"
                icon={<EyeOff className="w-5 h-5 text-red-500" />}
                title="Most votes = eliminated"
                description="Ties result in no elimination this round."
            />

            <div className="flex-1" />

            <button
                onClick={handleResolve}
                disabled={!canConfirm}
                className="w-full bg-destructive text-white py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Confirm Votes & Reveal →
            </button>
        </div>
    );
}