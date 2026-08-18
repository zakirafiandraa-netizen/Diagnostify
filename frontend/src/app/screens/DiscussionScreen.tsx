import { useState, useEffect, useRef } from "react";
import {
  Clock,
  PaperPlaneRight as Send,
  FirstAid as Stethoscope,
  Question as HelpCircle,
  UserMinus as UserX,
  Heartbeat,
  MagnifyingGlass,
  Flask,
  Warning,
  Pill,
  Users,
  BookOpen
} from "@phosphor-icons/react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { InfoBanner } from "../components/shared/InfoBanner";
import { ChatSection } from "../components/shared/ChatComponents";
import { RoundTableScene } from "../components/shared/RoundTableScene";
import { socket } from "../services/socket";

// Configuration matching RoleRevealedScreen for visual consistency
const ROLE_CONFIG = {
  "Civilian": {
    label: "Verified",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    icon: <Stethoscope className="w-8 h-8 text-primary" />,
    hint: "Blend in with the team. Give clues about your diagnosis without naming it directly.",
  },
  "Undercover": {
    label: "Conflicted",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: <UserX className="w-8 h-8 text-red-500" />,
    hint: "You have a different diagnosis! Blend in with the Verified players and don't get caught.",
  },
  "Mr White": {
    label: "Corrupted",
    color: "text-gray-500",
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
    icon: <HelpCircle className="w-8 h-8 text-gray-500" />,
    hint: "You have NO diagnosis word! Listen carefully to others to figure out the disease.",
  },
};

export default function DiscussionScreen() {
  const {
    players,
    chatMessages,
    playerId,
    roomCode,
    clueRequested,
    setClueRequested,
    myRole,
    myWord,
    gameCategory,
    caseNumber
  } = useGame();

  const [clue, setClue] = useState("");
  const [typingPlayerIds, setTypingPlayerIds] = useState<string[]>([]);
  const [speakingPlayerIds, setSpeakingPlayerIds] = useState<string[]>([]);

  // Refs to track timeouts across renders and avoid race conditions
  const typingTimeouts = useRef<Record<string, number>>({});
  const speakingTimeouts = useRef<Record<string, number>>({});

  useEffect(() => {
    const onChatTyping = (id: string) => {
      setTypingPlayerIds((prev) => [...new Set([...prev, id])]);

      // Auto-clear typing indicator after 5 seconds of inactivity (network fallback)
      if (typingTimeouts.current[id]) {
        window.clearTimeout(typingTimeouts.current[id]);
      }
      typingTimeouts.current[id] = window.setTimeout(() => {
        setTypingPlayerIds((prev) => prev.filter((p) => p !== id));
        delete typingTimeouts.current[id];
      }, 5000);
    };

    const onChatStopTyping = (id: string) => {
      setTypingPlayerIds((prev) => prev.filter((p) => p !== id));
      if (typingTimeouts.current[id]) {
        window.clearTimeout(typingTimeouts.current[id]);
        delete typingTimeouts.current[id];
      }
    };

    const onChatMessage = (msg: any) => {
      const id = typeof msg === "string" ? msg : msg?.playerId;
      if (!id) return;

      // The player sent a message, so they are no longer typing
      onChatStopTyping(id);

      // Add to speaking indicators
      setSpeakingPlayerIds((prev) => [...new Set([...prev, id])]);

      // Debounce speaking state clear (clears existing timer first)
      if (speakingTimeouts.current[id]) {
        window.clearTimeout(speakingTimeouts.current[id]);
      }
      speakingTimeouts.current[id] = window.setTimeout(() => {
        setSpeakingPlayerIds((prev) => prev.filter((p) => p !== id));
        delete speakingTimeouts.current[id];
      }, 3000);
    };

    socket.on("chat:typing", onChatTyping);
    socket.on("chat:stop_typing", onChatStopTyping);
    socket.on("chat:message", onChatMessage);

    return () => {
      socket.off("chat:typing", onChatTyping);
      socket.off("chat:stop_typing", onChatStopTyping);
      socket.off("chat:message", onChatMessage);

      // Clean up all running timeouts on unmount
      Object.values(typingTimeouts.current).forEach(window.clearTimeout);
      Object.values(speakingTimeouts.current).forEach(window.clearTimeout);
    };
  }, []);

  const currentPlayer = players.find(p => p.id === playerId);
  const playerName = currentPlayer?.name || "Player";
  const isSpectator = currentPlayer?.status === "Eliminated";

  const roleDetails = ROLE_CONFIG[myRole as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG["Civilian"];

  const sendMessage = (message: string) => {
    if (!roomCode || !message.trim()) return;
    socket.emit(isSpectator ? "spectator:message" : "chat:message", {
      roomCode,
      playerName,
      color: currentPlayer?.color || "#3B82F6",
      message,
    });
  };

  const handleSendClue = () => {
    if (!clue.trim()) return;
    sendMessage(`🩺 Clue: "${clue.trim()}"`);
    if (clueRequested) setClueRequested(false);
    setClue("");
    socket.emit("chat:stop_typing", roomCode || "");
  };

  const handleTyping = (text: string) => {
    if (isSpectator) return;
    if (text.trim() === "") {
      socket.emit("chat:stop_typing", roomCode || "");
    } else {
      socket.emit("chat:typing", roomCode || "");
    }
  };

  const playerClues: Record<string, string> = {};
  chatMessages.forEach(m => {
    if (m.msg.startsWith('🩺 Clue: "') && m.msg.endsWith('"')) {
      playerClues[m.player] = m.msg.substring('🩺 Clue: "'.length, m.msg.length - 1);
    }
  });

  return (
    <div className="flex flex-col h-screen relative">
      <NavBar title="Discussion Phase" />

      {/* Main content: left column (explanation & secret role info) / right column (table + chat) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 lg:px-8 overflow-hidden min-h-0">

        {/* LEFT column — Info, tailored guidelines, and secret diagnosis */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <InfoBanner
            color="blue"
            icon={<Clock className="w-5 h-5 text-primary" />}
            title="Discussion Phase"
            description="Each player gives one clue about their disease. Don't reveal it directly!"
          />

          {!isSpectator && (
            <>
              {/* Clue Guideline Card */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <span className="text-lg">📋</span>
                  <h4 className="font-bold text-sm text-foreground">How to Formulate Your Clue</h4>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-primary text-sm font-semibold shrink-0">1.</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {myRole === "Civilian" && (
                        <>
                          Describe symptoms, diagnostic tests, or typical patient presentations for <strong className="text-foreground font-semibold">{myWord}</strong>. Do not say the word itself.
                        </>
                      )}
                      {myRole === "Undercover" && (
                        <>
                          You have a conflicting diagnosis: <strong className="text-red-500 font-semibold">{myWord}</strong>. Formulate a clue that fits both your word and general category <strong className="text-foreground font-semibold">{gameCategory}</strong> so you can blend in with the Verified players.
                        </>
                      )}
                      {myRole === "Mr White" && (
                        <>
                          You have no diagnosis! Listen to clues given by others, identify the general category (<strong className="text-foreground font-semibold">{gameCategory}</strong>), and say something broad enough to blend in.
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-primary text-sm font-semibold shrink-0">2.</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {myRole === "Civilian" && "Avoid making it too obvious so the Corrupted (Mr White) player cannot guess the word."}
                      {myRole === "Undercover" && "Try to guess what the Verified word is from other players' clues and adapt your tone to match."}
                      {myRole === "Mr White" && "Try to deduce the real diagnosis word. You will need it to win in the final round!"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clue Types Card */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Flask className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-sm text-foreground">Clues May Include</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { icon: <Heartbeat className="w-3.5 h-3.5" />, label: "Symptoms" },
                    { icon: <MagnifyingGlass className="w-3.5 h-3.5" />, label: "Physical exam findings" },
                    { icon: <Flask className="w-3.5 h-3.5" />, label: "Lab / imaging findings" },
                    { icon: <Warning className="w-3.5 h-3.5" />, label: "Complications" },
                    { icon: <Pill className="w-3.5 h-3.5" />, label: "Treatment" },
                    { icon: <Users className="w-3.5 h-3.5" />, label: "Epidemiology" },
                    { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Basic medical sciences" },
                  ] as const).map(({ icon, label }) => (
                    <div key={label} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <span className="text-primary shrink-0">{icon}</span>
                      <span className="text-xs text-muted-foreground leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secret Diagnosis Card */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                  <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Secret Diagnosis Card</span>
                  <span className="font-mono text-xs font-bold bg-muted px-2.5 py-0.5 rounded-md border border-border/50">
                    CASE #{caseNumber}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${roleDetails.bg} border border-transparent`}>
                    {roleDetails.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-0.5">
                      {myRole === "Mr White" ? "No Word Assigned" : "Your Working Diagnosis"}
                    </p>
                    <p className={`text-xl font-bold ${roleDetails.color}`}>
                      {myWord || "—"}
                    </p>
                  </div>
                </div>

                <div className={`mt-4 p-3 rounded-xl ${roleDetails.bg}/60 border border-border/20 text-xs text-foreground/80 leading-relaxed`}>
                  <span className="font-semibold block mb-0.5">Role: {roleDetails.label}</span>
                  {roleDetails.hint}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT column: top = round table, bottom = realtime chat */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* RIGHT TOP — round table */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden py-2 shrink-0">
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

          {/* RIGHT BOTTOM — realtime chat, fills remaining height */}
          <div className="flex-1 min-h-0 flex flex-col">
            <ChatSection messages={chatMessages} onSendMessage={sendMessage} />
          </div>
        </div>
      </div>

      {/* Clue submission — only rendered when a privileged player requested it */}
      {clueRequested && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm border border-border shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔍</span>
              <label className="text-lg font-bold text-foreground" htmlFor="clue-input">
                Submit a Clue
              </label>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              You have been requested to submit a clue by another player using their privilege.
            </p>
            <textarea
              id="clue-input"
              value={clue}
              onChange={(e) => {
                setClue(e.target.value);
                handleTyping(e.target.value);
              }}
              placeholder="Describe your disease without naming it…"
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none h-28 text-foreground placeholder:text-muted-foreground leading-relaxed"
            />
            <button
              onClick={handleSendClue}
              disabled={!clue.trim()}
              className="w-full mt-4 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Send className="w-4 h-4" /> Submit Clue
            </button>
          </div>
        </div>
      )}

      <div className="p-4 lg:px-8 border-t border-border bg-card">
        {!isSpectator ? (
          <button
            onClick={() => socket.emit("vote:start", roomCode)}
            className="w-full bg-destructive text-destructive-foreground py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Go to Voting Phase →
          </button>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-2">You are spectating this round.</p>
        )}
      </div>
    </div>
  );
}