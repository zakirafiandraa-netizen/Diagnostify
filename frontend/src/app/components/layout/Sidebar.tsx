import { Stethoscope, Check, ChevronLeft } from "lucide-react";
import { useGame } from "../../context/GameContext";
import { SCREEN_META } from "../../constants";
import { socket } from "../../services/socket";
import {
  PlayIcon, JoystickIcon,
  UsersThreeIcon, VirusIcon,
} from "@phosphor-icons/react";


const SETUP_STEP: Record<string, number> = {
  "offline-players": 0, "offline-category": 1, "offline-summary": 2,
};
const GAME_SCREENS = new Set(["lobby-main", "lobby-players", "choose-role", "role-revealed", "discussion", "voting"]);

export function Sidebar() {
  const { screen, go, roomCode, players, selectedCategory, gameCategory, playerId } = useGame();
  const meta = SCREEN_META[screen];
  const isSetup = screen in SETUP_STEP;
  const step = SETUP_STEP[screen] ?? -1;

  // Assuming Civilian for the active player view
  const currentPlayer = players.find(p => p.id === playerId);
  const activeRole = currentPlayer?.role || "Pending...";

  const handleHome = () => {
    if (roomCode) socket.emit("room:leave", roomCode);
    go("home");
  };

  return (
    <aside
      className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 sticky top-0 h-screen overflow-y-auto bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shadow-lg shadow-black/10">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-sidebar-foreground text-lg leading-none font-sans">Diagnostify</p>
            <p className="text-sidebar-foreground/50 text-xs mt-0.5">Medical mystery game</p>
          </div>
        </div>
      </div>

      {/* Context */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div>
          <p className="text-sidebar-foreground/40 text-xs font-semibold uppercase tracking-widest mb-1.5">Now Viewing</p>
          <p className="text-sidebar-foreground font-bold text-xl leading-tight">{meta?.title || "Loading..."}</p>
          <p className="text-sidebar-foreground/60 text-sm mt-1 leading-snug">{meta?.subtitle || ""}</p>
        </div>

        {/* Setup stepper */}
        {isSetup && (
          <div className="space-y-1">
            <p className="text-sidebar-foreground/40 text-xs font-semibold uppercase tracking-widest mb-3">Setup Progress</p>
            {[
              { label: "Add Players", desc: "Build your team" },
              { label: "Choose Category", desc: "Pick a disease theme" },
              { label: "Review & Start", desc: "Launch the game" },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-all ${i < step ? "bg-sidebar-primary text-sidebar-primary-foreground" :
                  i === step ? "bg-sidebar-primary text-sidebar-primary-foreground ring-4 ring-sidebar-ring" :
                    "bg-sidebar-accent text-sidebar-accent-foreground/50"}`}>
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <div>
                  <p className={`text-sm font-semibold transition-colors ${i <= step ? "text-sidebar-foreground" : "text-sidebar-foreground/50"}`}>{s.label}</p>
                  <p className={`text-xs transition-colors ${i <= step ? "text-sidebar-foreground/60" : "text-sidebar-foreground/30"}`}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Home stats */}
        {screen === "home" && (
          <div className="space-y-2">
            <p className="text-sidebar-foreground/40 text-xs font-semibold uppercase tracking-widest mb-3">At a Glance</p>
            {[
              { label: "Game Modes", value: "2", icon: JoystickIcon },
              { label: "Max Players", value: "10", icon: UsersThreeIcon },
              { label: "Disease Words", value: "50+", icon: VirusIcon },
              { label: "Categories", value: "11", icon: PlayIcon },
            ].map((s) => (
              <div key={s.label} className="bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors rounded-xl p-3 flex items-center gap-3 cursor-default">
                <s.icon className="w-6 h-6 text-sidebar-foreground" />
                <div>
                  <p className="text-sidebar-foreground font-bold text-sm leading-none">{s.value}</p>
                  <p className="text-sidebar-foreground/50 text-xs mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active game session info */}
        {GAME_SCREENS.has(screen) && (
          <div>
            <p className="text-sidebar-foreground/40 text-xs font-semibold uppercase tracking-widest mb-3">Session</p>
            <div className="bg-sidebar-accent rounded-xl p-4 space-y-2.5">
              {[
                { k: "Room Code", v: roomCode, mono: true },
                { k: "Players", v: `${players.length} / 8` },
                { k: "Category", v: (gameCategory || selectedCategory) || "—" },
                { k: "Your Role", v: activeRole, accent: true },
              ].map((r) => (
                <div key={r.k} className="flex justify-between text-xs">
                  <span className="text-sidebar-foreground/50">{r.k}</span>
                  <span className={`font-bold ${r.accent ? "text-primary" : "text-sidebar-foreground"} ${r.mono ? "font-mono tracking-wider" : ""}`}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-sidebar-border flex-shrink-0">
        {screen !== "home"
          ? <button onClick={handleHome} className="group flex items-center gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground text-sm transition-colors">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </button>
          : <p className="text-sidebar-foreground/30 text-xs">v1.0 — Medical Mystery</p>}
      </div>
    </aside>
  );
}
