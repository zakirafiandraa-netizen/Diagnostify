import { Users, Stethoscope } from "lucide-react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { StepBar } from "../components/shared/StepBar";
import { Avatar } from "../components/shared/Avatar";
import { PrimaryButtonBar } from "../components/shared/InfoBanner";

export default function SummaryScreen() {
  const { go, players, selectedCategory } = useGame();
  
  const n = players.length;
  const undercovers = Math.floor(n / 4);
  const mrWhite = n >= 4 ? 1 : 0;
  const civilians = n - undercovers - mrWhite;

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title="Game Summary" onBack={() => go("offline-category")} />
      <StepBar current={2} />
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4">
        <div className="lg:max-w-2xl lg:mx-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label:"Players", value: players.length.toString(), icon:<Users className="w-5 h-5" /> },
              { label:"Category", value: selectedCategory, icon:<Stethoscope className="w-5 h-5" /> },
            ].map((item) => (
              <div key={item.label} className="bg-card rounded-2xl p-4 lg:p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="text-primary mb-2">{item.icon}</div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-bold text-foreground text-sm mt-0.5 leading-snug">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-card rounded-2xl p-4 lg:p-5 border border-border shadow-sm">
            <h4 className="font-semibold text-sm mb-3">Role Distribution</h4>
            <div className="grid grid-cols-3 gap-2 lg:gap-3">
              {[
                { role:"Civilian",   count: civilians, emoji:"🏥", color:"#0D9488" },
                { role:"Undercover", count: undercovers, emoji:"🕵️", color:"#F97316" },
                { role:"Mr. White",  count: mrWhite, emoji:"👤", color:"#7C3AED" },
              ].map((r) => (
                <div key={r.role} className="rounded-xl p-3 lg:p-4 text-center" style={{ backgroundColor:r.color+"15" }}>
                  <div className="text-xl lg:text-2xl mb-1">{r.emoji}</div>
                  <div className="font-bold text-lg lg:text-2xl" style={{ color:r.color }}>{r.count}</div>
                  <div className="text-xs text-muted-foreground">{r.role}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 lg:p-5 border border-border shadow-sm">
            <h4 className="font-semibold text-sm mb-3">Players</h4>
            <div className="space-y-2">
              {players.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-1 px-2 rounded-xl hover:bg-muted/40 transition-colors">
                  <Avatar name={p.name} color={p.color} size="sm" />
                  <span className="text-sm text-foreground flex-1">{p.name}</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Role hidden</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <PrimaryButtonBar onClick={() => go("choose-role")} label="🎮 Start Game" maxWidth={true} />
    </div>
  );
}
