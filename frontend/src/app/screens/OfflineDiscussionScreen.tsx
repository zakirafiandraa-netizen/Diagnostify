import { useState } from "react";
import { MessageCircle, Home } from "lucide-react";
import { useGame } from "../context/GameContext";
import { useOfflineGame } from "../context/OfflineGameContext";
import { InfoBanner } from "../components/shared/InfoBanner";
import { Avatar } from "../components/shared/Avatar";

export default function OfflineDiscussionScreen() {
    const { go } = useGame();
    const { offlinePlayers, round, goToVoting, resetOfflineGame, clueRequestTarget } = useOfflineGame();
    const [confirmEnd, setConfirmEnd] = useState(false);

    const alivePlayers = offlinePlayers.filter(p => p.status === "Alive");
    const cluePlayer = offlinePlayers.find(p => p.id === clueRequestTarget);

    const handleEndGame = () => {
        resetOfflineGame();
        go("home");
    };

    return (
        <div className="flex flex-col min-h-screen px-4 py-6 gap-4">
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

            <div className="flex justify-end">
                <button
                    onClick={() => setConfirmEnd(true)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
                >
                    <Home className="w-3.5 h-3.5" />
                    End Game
                </button>
            </div>

            <div className="text-center py-2">
                <MessageCircle className="w-10 h-10 text-primary mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-foreground">Discussion — Round {round}</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    Each player takes turns giving a clue about their word out loud. Don't say it directly!
                </p>
            </div>

            {cluePlayer && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <p className="text-sm text-purple-800">
                        <strong>{cluePlayer.name}</strong> must give an <strong>extra clue</strong> this round (Clue Request privilege).
                    </p>
                </div>
            )}

            <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Still in the game ({alivePlayers.length})
                </p>
                <div className="flex flex-wrap gap-3">
                    {alivePlayers.map(p => (
                        <div key={p.id} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1">
                            <Avatar name={p.name} color={p.color} size="sm" />
                            <span className="text-sm font-medium text-foreground">{p.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <InfoBanner
                color="blue"
                icon={<MessageCircle className="w-5 h-5 text-blue-500" />}
                title="Host's Job"
                description="Once everyone has given their clue out loud, move to voting — cover your eyes and let the host tally the votes."
            />

            <div className="flex-1" />

            <button
                onClick={() => { goToVoting(); go("offline-voting"); }}
                className="w-full bg-destructive text-white py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all"
            >
                Go to Voting Phase →
            </button>
        </div>
    );
}