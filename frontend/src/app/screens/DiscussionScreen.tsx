import { useState, useEffect } from "react";
import { Clock, PaperPlaneRight as Send } from "@phosphor-icons/react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { InfoBanner } from "../components/shared/InfoBanner";
import { ChatSection, ChatSidebar } from "../components/shared/ChatComponents";
import { RoundTableScene } from "../components/shared/RoundTableScene";
import { socket } from "../services/socket"

export default function DiscussionScreen() {
  const { players, chatMessages, playerId, roomCode, clueRequested, setClueRequested } = useGame();
  const [clue, setClue] = useState("");
  const [typingPlayerIds, setTypingPlayerIds] = useState<string[]>([]);
  const [speakingPlayerIds, setSpeakingPlayerIds] = useState<string[]>([]);

  useEffect(() => {
    const onChatTyping = (id: string) => {
      setTypingPlayerIds((prev) => [...new Set([...prev, id])]);
    };

    const onChatMessage = (msg: any) => {
      const id = typeof msg === "string" ? msg : msg?.playerId;
      if (!id) return;
      setTypingPlayerIds((prev) => prev.filter((p) => p !== id));
      setSpeakingPlayerIds((prev) => [...new Set([...prev, id])]);
      setTimeout(() => {
        setSpeakingPlayerIds((prev) => prev.filter((p) => p !== id));
      }, 3000);
    };

    socket.on("chat:typing", onChatTyping);
    socket.on("chat:message", onChatMessage);

    return () => {
      socket.off("chat:typing", onChatTyping);
      socket.off("chat:message", onChatMessage);
    };
  }, []);

  const currentPlayer = players.find(p => p.id === playerId);
  const playerName = currentPlayer?.name || "Player";

  // Update your input handler
  const handleSendClue = () => {
    if (clue.trim()) {
      const isSpectator = currentPlayer?.status === "Eliminated";
      socket.emit(isSpectator ? "spectator:message" : "chat:message", {
        roomCode: roomCode || "",
        playerName: playerName,
        color: currentPlayer?.color || "#3B82F6",
        message: `🩺 Clue: "${clue.trim()}"`,
      });
      if (clueRequested) setClueRequested(false);
      setClue("");
    }
  };

  // Typing indicator — only alive players emit this
  const handleTyping = () => {
    if (currentPlayer?.status === "Eliminated") return;
    socket.emit("chat:typing", roomCode || "");
  };

  const playerClues: Record<string, string> = {};
  chatMessages.forEach(m => {
    if (m.msg.startsWith('🩺 Clue: "') && m.msg.endsWith('"')) {
      playerClues[m.player] = m.msg.substring('🩺 Clue: "'.length, m.msg.length - 1);
    }
  });

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0 relative">
      <NavBar title="Discussion Phase" />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden py-2">
            {players.length > 0 ? (
              <RoundTableScene
                players={players.filter(p => p.status !== "Eliminated")}
                playerId={playerId}
                typingPlayerIds={typingPlayerIds}
                speakingPlayerIds={speakingPlayerIds}
                playerClues={playerClues}
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                Waiting for players…
              </div>
            )}
          </div>

          <InfoBanner
            color="blue"
            icon={<Clock className="w-5 h-5 text-primary" />}
            title="Discussion Phase"
            description="Each player gives one clue about their disease. Don't reveal it directly!"
          />

          {clueRequested && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-card rounded-2xl p-6 w-full max-w-sm border border-border shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🔍</span>
                  <label className="text-lg font-bold text-foreground" htmlFor="clue-input">Submit a Clue</label>
                </div>
                <p className="text-sm text-muted-foreground mb-4">You have been requested to submit a clue by another player using their privilege.</p>
                <textarea id="clue-input" value={clue} onChange={(e) => {
                  setClue(e.target.value);
                  handleTyping();
                }}
                  placeholder="Describe your disease without naming it…"
                  className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none h-28 text-foreground placeholder:text-muted-foreground leading-relaxed" />
                <button onClick={handleSendClue} disabled={!clue.trim()} className="w-full mt-4 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                  <Send className="w-4 h-4" /> Submit Clue
                </button>
              </div>
            </div>
          )}
          <div className="lg:hidden">
            <ChatSection
              messages={chatMessages}
              onSendMessage={(msg) => {
                if (roomCode) {
                  const isSpectator = currentPlayer?.status === "Eliminated";
                  socket.emit(isSpectator ? "spectator:message" : "chat:message", {
                    roomCode: roomCode,
                    playerName: playerName,
                    color: currentPlayer?.color || "#3B82F6",
                    message: msg,
                  });
                }
              }}
            />
          </div>
        </div>

        <ChatSidebar 
          messages={chatMessages} 
          onSendMessage={(msg) => {
            if (roomCode) {
              const isSpectator = currentPlayer?.status === "Eliminated";
              socket.emit(isSpectator ? "spectator:message" : "chat:message", {
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
        {currentPlayer?.status !== "Eliminated" ? (
          <button
            onClick={() => socket.emit("vote:start", roomCode)}
            className="w-full bg-destructive text-destructive-foreground py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all">
            Go to Voting Phase →
          </button>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-2">You are spectating this round.</p>
        )}
      </div>
    </div>
  );
}
