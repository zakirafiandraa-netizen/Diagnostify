import { useState, useEffect } from "react";
import { Clock, Send } from "lucide-react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { InfoBanner } from "../components/shared/InfoBanner";
import { ChatSection, ChatSidebar } from "../components/shared/ChatComponents";
import { RoundTableScene } from "../components/shared/RoundTableScene";
import { socket } from "../services/socket"

export default function DiscussionScreen() {
  const { players, chatMessages, playerId, roomCode, clueRequested } = useGame();
  const [clue, setClue] = useState("");
  const [typingPlayerIds, setTypingPlayerIds] = useState<string[]>([]);
  const [speakingPlayerIds, setSpeakingPlayerIds] = useState<string[]>([]);

  useEffect(() => {
    socket.on("chat:typing", (id: string) => {
      setTypingPlayerIds((prev) => [...new Set([...prev, id])]);
    });
    socket.on("chat:message", (msg: any) => {
      const id = typeof msg === "string" ? msg : msg?.playerId;
      if (!id) return;
      setTypingPlayerIds((prev) => prev.filter((p) => p !== id));
      setSpeakingPlayerIds((prev) => [...new Set([...prev, id])]);
      setTimeout(() => {
        setSpeakingPlayerIds((prev) => prev.filter((p) => p !== id));
      }, 3000);
    });
    return () => {
      socket.off("chat:typing");
      socket.off("chat:message");
    };
  }, []);

  const currentPlayer = players.find(p => p.id === playerId);
  const playerName = currentPlayer?.name || "Player";

  // Update your input handler
  const handleSendClue = () => {
    if (clue.trim()) {
      socket.emit("chat:message", {
        roomCode: roomCode || "",
        playerName: playerName,
        color: currentPlayer?.color || "#3B82F6",
        message: `🩺 Clue: "${clue.trim()}"`,
      });
      setClue("");
    }
  };

  // Add typing indicator
  const handleTyping = () => {
    socket.emit("chat:typing", roomCode || "");
  };

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title="Discussion Phase" />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden py-2">
            {players.length > 0 ? (
              <RoundTableScene
                players={players}
                playerId={playerId}
                typingPlayerIds={typingPlayerIds}


                speakingPlayerIds={speakingPlayerIds}
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                Waiting for players…
              </div>
            )}
          </div>

          <InfoBanner
            color="blue"
            icon={<Clock className="w-5 h-5 text-blue-500" />}
            title="Discussion Phase"
            description="Each player gives one clue about their disease. Don't reveal it directly!"
          />

          {clueRequested && (
          <div className="bg-card rounded-2xl p-4 lg:p-5 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🔍</span>
              <label className="text-sm font-semibold text-foreground" htmlFor="clue-input">You've Been Requested to Submit a Clue</label>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Another player used their quiz privilege to request a clue from you.</p>
            <textarea id="clue-input" value={clue} onChange={(e) => {
              setClue(e.target.value);
              handleTyping();
            }}
              placeholder="Describe your disease without naming it…"
              className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none h-24 text-foreground placeholder:text-muted-foreground leading-relaxed" />
            <button onClick={handleSendClue} className="w-full mt-3 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              <Send className="w-4 h-4" /> Submit Clue
            </button>
          </div>
          )}
          <div className="lg:hidden"><ChatSection messages={chatMessages} /></div>
        </div>

        <ChatSidebar 
          messages={chatMessages} 
          onSendMessage={(msg) => {
            if (roomCode) {
              socket.emit("chat:message", {
                roomCode: roomCode,
                playerName: playerName,
                color: currentPlayer?.color || "#3B82F6",
                message: msg,
              });
            }
          }} 
        />
      </div>

      <div className="p-4 lg:px-8 border-t border-border bg-card">
        {players.find(p => p.id === playerId)?.isHost ? (
          <button
            onClick={() => socket.emit("vote:start", roomCode)}
            className="w-full bg-destructive text-white py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all">
            Start Voting Phase →
          </button>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-2">Waiting for host to start voting…</p>
        )}
      </div>
    </div>
  );
}
