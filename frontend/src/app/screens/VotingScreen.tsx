import { useState, useCallback, useEffect } from "react";
import { Shield, CheckCircle as CheckCircle2, WarningCircle as AlertCircle } from "@phosphor-icons/react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { Avatar } from "../components/shared/Avatar";
import { InfoBanner } from "../components/shared/InfoBanner";
import { ChatSection, ChatSidebar } from "../components/shared/ChatComponents";
import { socket } from "../services/socket";

export default function VotingScreen() {
  const {
    players, chatMessages, roomCode, playerId,
    votesCast, totalVoters, eliminatedPlayer, voteTied,
  } = useGame();

  const currentPlayer = players.find(p => p.id === playerId);
  const playerName = currentPlayer?.name || "Player";
  const isAlive = currentPlayer?.status !== "Eliminated";

  const [myVote, setMyVote] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Show feedback when a result comes in
  useEffect(() => {
    if (eliminatedPlayer) {
      setFeedback(`🗳️ ${eliminatedPlayer.name} was eliminated (${eliminatedPlayer.role ?? "?"}).`);
    } else if (voteTied) {
      setFeedback("⚖️ It's a tie! Moving to quiz phase.");
    }
  }, [eliminatedPlayer, voteTied]);

  const handleVote = useCallback((targetId: string) => {
    if (submitted || !isAlive || targetId === playerId) return;
    setMyVote(targetId);
    socket.emit("vote:cast", { roomCode, targetId });
    setSubmitted(true);
  }, [submitted, isAlive, playerId, roomCode]);

  const alivePlayers = players.filter(p => p.status !== "Eliminated");

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title="Voting Phase" />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 space-y-4">

          {/* Live vote counter */}
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">Voting Status</p>
              <p className="text-xs text-muted-foreground mt-0.5">Who is the Undercover doctor?</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{votesCast}</span>
              <span className="text-lg text-muted-foreground"> / {totalVoters}</span>
              <p className="text-xs text-muted-foreground">votes cast</p>
            </div>
          </div>

          {/* Result feedback banner */}
          {feedback && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-2xl px-4 py-3">
              {voteTied
                ? <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
                : <CheckCircle2 className="w-5 h-5 text-destructive flex-shrink-0" />}
              <p className="text-sm font-medium text-destructive">{feedback}</p>
            </div>
          )}

          {/* Player list */}
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm space-y-2">
            {alivePlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-1.5 hover:bg-muted/30 px-2 rounded-xl transition-colors">
                <Avatar name={p.name} color={p.color} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  {p.isHost && <p className="text-xs text-muted-foreground">Host</p>}
                </div>
                {p.id !== playerId && isAlive && (
                  <button
                    onClick={() => handleVote(p.id)}
                    disabled={submitted}
                    aria-label={`Vote for ${p.name}`}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                      myVote === p.id
                        ? "bg-primary/20 text-primary cursor-default"
                        : submitted
                          ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                          : "bg-primary text-primary-foreground hover:opacity-80"
                    }`}
                  >
                    {myVote === p.id ? "Voted ✓" : "Vote"}
                  </button>
                )}
              </div>
            ))}
          </div>

          {submitted && !feedback && (
            <p className="text-center text-xs text-muted-foreground animate-pulse">
              Waiting for all players to vote…
            </p>
          )}

          <InfoBanner
            color="red"
            icon={<Shield className="w-5 h-5 text-destructive" />}
            title="How Voting Works"
            description="Most votes = eliminated. Undercover and Mr. White must survive!"
          />

          <div className="lg:hidden">
            <ChatSection
              messages={chatMessages}
              onSendMessage={(msg) => {
                if (roomCode) {
                  const isSpectator = currentPlayer?.status === "Eliminated";
                  socket.emit(isSpectator ? "spectator:message" : "chat:message", {
                    roomCode,
                    playerName,
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
                roomCode,
                playerName,
                color: currentPlayer?.color || "#3B82F6",
                message: msg,
              });
            }
          }}
        />
      </div>
    </div>
  );
}
