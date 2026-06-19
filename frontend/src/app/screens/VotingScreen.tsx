import { useState, useCallback } from "react";
import { Shield } from "lucide-react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { Avatar } from "../components/shared/Avatar";
import { InfoBanner } from "../components/shared/InfoBanner";
import { ChatSection, ChatSidebar } from "../components/shared/ChatComponents";

export default function VotingScreen() {
  const { go, players, chatMessages } = useGame();
  const [voted, setVoted] = useState<Set<string>>(new Set());

  // Stabilized callback to prevent creating new Set on every render inside the loop
  const handleVote = useCallback((id: string) => {
    setVoted((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title="Voting Phase" />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-orange-800">Voting Status</p>
              <p className="text-xs text-orange-600 mt-0.5">Who is the Undercover doctor?</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-orange-700">{voted.size}</span>
              <span className="text-lg text-orange-400" aria-label="of total players"> / {players.length}</span>
              <p className="text-xs text-orange-500">votes cast</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm space-y-2">
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-1.5 hover:bg-muted/30 px-2 rounded-xl transition-colors">
                <Avatar name={p.name} color={p.color} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  {i === 0 && <p className="text-xs text-muted-foreground">Host</p>}
                </div>
                {i !== 0 && (
                  <button onClick={() => handleVote(p.id)}
                    aria-label={`Vote for ${p.name}`}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                      voted.has(p.id) ? "bg-green-100 text-green-700 cursor-default" : "bg-accent text-white hover:opacity-80"}`}>
                    {voted.has(p.id) ? "Voted ✓" : "Vote"}
                  </button>
                )}
              </div>
            ))}
          </div>

          <InfoBanner 
            color="red" 
            icon={<Shield className="w-5 h-5 text-red-500" />} 
            title="How Voting Works" 
            description="Most votes = eliminated. Undercover and Mr. White must survive!" 
          />

          <div className="lg:hidden"><ChatSection messages={chatMessages.slice(0, 2)} /></div>
        </div>

        <ChatSidebar messages={chatMessages} />
      </div>

      <div className="p-4 lg:px-8 border-t border-border bg-card">
        <button onClick={() => go("finalist")} className="w-full bg-destructive text-white py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all">
          Confirm Votes →
        </button>
      </div>
    </div>
  );
}
