import { useState, useEffect } from "react";
import { Check, Copy, Clock, BookOpen } from "lucide-react";
import { useGame } from "../context/GameContext";
import { socket } from "../services/socket";
import { clearSession } from "../services/session";

export default function LobbyMainScreen() {
  const { go, roomCode, players, selectedCategory, setSelectedCategory, playerId } = useGame();
  const [copied, setCopied] = useState(false);
  const [quizCategories, setQuizCategories] = useState<string[]>([]);

  const isHost = players.find((p) => p.id === playerId)?.isHost ?? false;

  // Fetch quiz categories from backend on mount
  useEffect(() => {
    socket.emit("lobby:get_categories");
    const onCategories = (cats: string[]) => {
      setQuizCategories(cats);
      // If no category selected yet, default to first quiz category
      if (!selectedCategory || selectedCategory === "Acak") {
        const first = cats[0];
        if (first && isHost) {
          setSelectedCategory(first);
          if (roomCode) {
            socket.emit("lobby:category_change", { roomCode, category: first });
          }
        }
      }
    };
    socket.on("lobby:categories", onCategories);
    return () => { socket.off("lobby:categories", onCategories); };
  }, [roomCode, isHost]); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = () => {
    if (roomCode) navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    if (roomCode) {
      socket.emit("lobby:category_change", { roomCode, category: cat });
    }
  };

  const handleStart = () => {
    if (!roomCode || !isHost) return;
    socket.emit("game:start", { code: roomCode, category: selectedCategory });
  };

  const handleLeave = () => {
    if (roomCode) socket.emit("room:leave", roomCode);
    clearSession();
    go("online-join");
  };

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={handleLeave} className="text-sm text-muted-foreground hover:text-destructive transition-colors">← Leave</button>
        <span className="font-semibold text-sm text-foreground">Game Lobby</span>
        {isHost
          ? <button onClick={() => go("lobby-players")} className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">Next →</button>
          : <div className="w-16" />
        }
      </div>
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-5">
        <div className="lg:max-w-xl lg:mx-auto space-y-5">
          {/* Room code card */}
          <div className="bg-primary rounded-2xl lg:rounded-3xl p-5 lg:p-7 shadow-xl shadow-primary/20">
            <p className="text-white/55 text-xs mb-3 font-semibold tracking-widest uppercase">Room Code</p>
            <div className="flex items-center justify-between">
              <span className="text-white font-mono font-bold text-4xl lg:text-5xl tracking-[0.2em]">{roomCode}</span>
              <button onClick={copy}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Game status */}
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <h4 className="font-semibold text-sm mb-3">Game Status</h4>
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 rounded-xl p-3 flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <span className="text-xs text-orange-700 dark:text-orange-400 font-medium">Waiting for players to join…</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Players Joined", value: `${players.length} / 8` },
                { label: "Current Phase", value: "Lobby" }
              ].map((s) => (
                <div key={s.label} className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="font-bold text-sm text-foreground mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz Theme selector */}
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Quiz Theme</h4>
              {!isHost && (
                <span className="ml-auto text-xs text-muted-foreground italic">Set by host</span>
              )}
            </div>

            {isHost ? (
              <>
                <div className="grid grid-cols-1 gap-2">
                  {quizCategories.length === 0 ? (
                    <div className="bg-muted rounded-xl px-3 py-2.5 text-sm text-muted-foreground animate-pulse">
                      Loading categories…
                    </div>
                  ) : (
                    quizCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                          selectedCategory === cat
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                            : "bg-muted text-foreground border-transparent hover:border-primary/30 hover:bg-muted/70"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {selectedCategory === cat && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                          {cat}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="bg-muted rounded-xl px-4 py-3 text-sm text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                {selectedCategory || "Waiting for host to pick…"}
              </div>
            )}
          </div>

          {/* Start button — host only */}
          {isHost && (
            <button
              onClick={handleStart}
              disabled={players.length < 3}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {players.length < 3 ? `Need ${3 - players.length} more player(s)` : "Start Game"}
            </button>
          )}

          {/* Non-host waiting message */}
          {!isHost && (
            <div className="text-center text-sm text-muted-foreground py-2">
              Waiting for the host to start the game…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
