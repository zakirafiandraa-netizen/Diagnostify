import { Check, Stethoscope, Lock, Clock } from "lucide-react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { Avatar } from "../components/shared/Avatar";
import { PrimaryButtonBar } from "../components/shared/InfoBanner";

export default function RoleRevealedScreen() {
  const { go, players } = useGame();

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title="Your Role" />
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4">
        <div className="lg:max-w-3xl lg:mx-auto lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
          <div className="bg-card rounded-2xl border-2 border-primary p-5 lg:p-7 relative shadow-xl shadow-primary/10">
            <div className="absolute -top-3 -right-3 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs text-muted-foreground font-mono">#2 — Your Card</span>
            <div className="flex flex-col items-center py-6 lg:py-8">
              <Stethoscope className="w-12 h-12 lg:w-16 lg:h-16 text-primary mb-4" />
              <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-1">Your Disease</p>
              <p className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Aritmia</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 text-center max-w-xs">
                <p className="text-xs text-yellow-700">🤫 Keep your disease secret! Give clues without saying it directly.</p>
              </div>
            </div>
            <div className="pt-3 border-t border-border flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Your Role</span>
              <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">Civilian</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[{ n:1, by: players[0]?.name || "Budi" },{ n:3, by: players[1]?.name || "Siti" },{ n:4, by: players[2]?.name || "Dewi" }].map((c) => (
                <div key={c.n} className="bg-card rounded-xl border border-border p-3 flex flex-col items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">#{c.n}</span>
                  <Lock className="w-6 h-6 text-destructive/50" />
                  <p className="text-xs text-destructive font-medium text-center leading-tight">Taken by {c.by}</p>
                </div>
              ))}
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
              <h4 className="font-semibold text-sm mb-3">Player Selection Status</h4>
              <div className="grid grid-cols-2 gap-2">
                {players.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 bg-muted/40 rounded-xl">
                    <Avatar name={p.name} color={p.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Card #{i+1}</p>
                    </div>
                    {i < 3 ? <Check className="w-3 h-3 text-green-500 flex-shrink-0" /> : <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <PrimaryButtonBar onClick={() => go("discussion")} label="Start Discussion Phase →" maxWidth={true} />
    </div>
  );
}
