import { useState } from "react";
import { Check, Copy, Clock } from "lucide-react";
import { useGame } from "../context/GameContext";
import { CATEGORIES } from "../constants";
import { socket } from "../services/socket";

export default function LobbyMainScreen() {
  const { go, roomCode, players, selectedCategory, setSelectedCategory, playerId } = useGame();
  const [copied, setCopied] = useState(false);

  const isHost = players.find((p) => p.id === playerId)?.isHost ?? false;

  const copy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    if (!roomCode || !isHost) return;
    socket.emit("game:start", { code: roomCode, category: selectedCategory });
  };

  const handleLeave = () => {
    if (roomCode) socket.emit("room:leave", roomCode);
    go("online-join");
  };

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={handleLeave} className="text-sm text-muted-foreground hover:text-destructive transition-colors">← Leave</button>
        <span className="font-semibold text-sm text-foreground">Game Lobby</span>
        {/* Only host sees Next, others see nothing */}
        {isHost
          ? <button onClick={() => go("lobby-players")} className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">Next →</button>
          : <div className="w-16" /> 
        }
      </div>
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-5">
        <div className="lg:max-w-xl lg:mx-auto space-y-5">
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
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <h4 className="font-semibold text-sm mb-3">Game Status</h4>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <span className="text-xs text-orange-700 font-medium">Waiting for players to join…</span>
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
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <h4 className="font-semibold text-sm mb-3">Game Theme</h4>
            {isHost ? (
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            ) : (
              <div className="bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground">
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
