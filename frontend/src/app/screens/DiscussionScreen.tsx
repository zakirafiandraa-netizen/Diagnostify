import { useState } from "react";
import { Clock, Send, Crown } from "lucide-react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { Avatar } from "../components/shared/Avatar";
import { InfoBanner, PrimaryButtonBar } from "../components/shared/InfoBanner";
import { ChatSection, ChatSidebar } from "../components/shared/ChatComponents";

export default function DiscussionScreen() {
  const { go, players, chatMessages } = useGame();
  const [clue, setClue] = useState("");

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title="Discussion Phase" />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1.5 bg-card border border-border rounded-full pl-1 pr-3 py-1 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                <Avatar name={p.name} color={p.color} size="sm" />
                <span className="text-xs font-medium text-foreground">{p.name}</span>
                {i === 0 && <Crown className="w-3 h-3 text-yellow-500" />}
              </div>
            ))}
          </div>
          
          <InfoBanner 
            color="blue" 
            icon={<Clock className="w-5 h-5 text-blue-500" />} 
            title="Discussion Phase" 
            description="Each player gives one clue about their disease. Don't reveal it directly!" 
          />

          <div className="bg-card rounded-2xl p-4 lg:p-5 border border-border shadow-sm">
            <label className="text-sm font-semibold text-foreground block mb-2" htmlFor="clue-input">Submit Your Diagnosis Clue</label>
            <textarea id="clue-input" value={clue} onChange={(e) => setClue(e.target.value)}
              placeholder="Describe your disease without naming it…"
              className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none h-24 text-foreground placeholder:text-muted-foreground leading-relaxed" />
            <button className="w-full mt-3 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              <Send className="w-4 h-4" /> Submit Clue
            </button>
          </div>
          <div className="lg:hidden"><ChatSection messages={chatMessages} /></div>
        </div>

        <ChatSidebar messages={chatMessages} />
      </div>

      <PrimaryButtonBar onClick={() => go("voting")} label="Go to Voting Phase →" />
    </div>
  );
}
