import { useGame } from "../context/GameContext";
import { clearSession } from "../services/session";

export default function SessionExpiredScreen() {
    const { go } = useGame();

    const handleGoHome = () => {
        clearSession();
        go("home");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-background">
            <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-lg space-y-4">
                <div className="text-5xl">🏥</div>
                <h1 className="text-xl font-bold text-foreground">Session Ended</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    The room you were in no longer exists or has already ended. You've been disconnected.
                </p>
                <button
                    onClick={handleGoHome}
                    className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
}