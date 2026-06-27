import { Stethoscope, Check, ChevronLeft } from "lucide-react";
import { useGame } from "../../context/GameContext";
import { SCREEN_META } from "../../constants";
import { socket } from "../../services/socket";

const SETUP_STEP: Record<string, number> = {
  "offline-players": 0, "offline-category": 1, "offline-summary": 2,
};
const GAME_SCREENS = new Set(["lobby-main","lobby-players","choose-role","role-revealed","discussion","voting"]);

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
      className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 sticky top-0 h-screen overflow-y-auto"
      style={{
        background: "linear-gradient(155deg, #0D9488 0%, #065F5A 100%)",
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.065) 1px, transparent 1px), linear-gradient(155deg, #0D9488 0%, #065F5A 100%)",
        backgroundSize: "22px 22px, 100% 100%",
      }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/20">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-lg leading-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>Diagnostify</p>
            <p className="text-white/50 text-xs mt-0.5">Medical mystery game</p>
          </div>
        </div>
      </div>

      {/* Context */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1.5">Now Viewing</p>
          <p className="text-white font-bold text-xl leading-tight">{meta?.title || "Loading..."}</p>
          <p className="text-white/60 text-sm mt-1 leading-snug">{meta?.subtitle || ""}</p>
        </div>

        {/* Setup stepper */}
        {isSetup && (
          <div className="space-y-1">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Setup Progress</p>
            {[
              { label: "Add Players", desc: "Build your team" },
              { label: "Choose Category", desc: "Pick a disease theme" },
              { label: "Review & Start", desc: "Launch the game" },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-all ${
                  i < step ? "bg-white text-primary" :
                  i === step ? "bg-white text-primary ring-4 ring-white/25" :
                  "bg-white/15 text-white/40"}`}>
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <div>
                  <p className={`text-sm font-semibold transition-colors ${i <= step ? "text-white" : "text-white/35"}`}>{s.label}</p>
                  <p className={`text-xs transition-colors ${i <= step ? "text-white/55" : "text-white/25"}`}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Home stats */}
        {screen === "home" && (
          <div className="space-y-2">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">At a Glance</p>
            {[
              { label: "Game Modes", value: "3",   icon: "🎮" },
              { label: "Max Players", value: "10",  icon: "👥" },
              { label: "Disease Words", value: "50+", icon: "🩺" },
              { label: "Categories", value: "11",  icon: "📋" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 hover:bg-white/16 transition-colors rounded-xl p-3 flex items-center gap-3 cursor-default">
                <span className="text-xl">{s.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm leading-none">{s.value}</p>
                  <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active game session info */}
        {GAME_SCREENS.has(screen) && (
          <div>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Session</p>
            <div className="bg-white/10 rounded-xl p-4 space-y-2.5">
              {[
                { k: "Room Code", v: roomCode, mono: true },
                { k: "Players", v: `${players.length} / 8` },
                { k: "Category", v: (gameCategory || selectedCategory) || "—" },
                { k: "Your Role", v: activeRole, accent: true },
              ].map((r) => (
                <div key={r.k} className="flex justify-between text-xs">
                  <span className="text-white/50">{r.k}</span>
                  <span className={`font-bold ${r.accent ? "text-emerald-300" : "text-white"} ${r.mono ? "font-mono tracking-wider" : ""}`}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10 flex-shrink-0">
        {screen !== "home"
          ? <button onClick={handleHome} className="group flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Home
            </button>
          : <p className="text-white/25 text-xs">v1.0 — Medical Mystery</p>}
      </div>
    </aside>
  );
}
