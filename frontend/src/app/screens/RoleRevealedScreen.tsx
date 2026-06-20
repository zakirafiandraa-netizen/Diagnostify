import { Stethoscope, HelpCircle, UserX } from "lucide-react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { PrimaryButtonBar } from "../components/shared/InfoBanner";

const ROLE_CONFIG = {
  "Civilian": {
    label: "Civilian",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary",
    icon: <Stethoscope className="w-12 h-12 lg:w-16 lg:h-16 text-primary mb-4" />,
    hint: "🤫 You are a Civilian. Give clues about your disease without saying it directly.",
  },
  "Undercover": {
    label: "Undercover",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500",
    icon: <UserX className="w-12 h-12 lg:w-16 lg:h-16 text-red-500 mb-4" />,
    hint: "🕵️ You are the Undercover! Blend in with the Civilians. Don't get caught!",
  },
  "Mr White": {
    label: "Mr. White",
    color: "text-gray-500",
    bg: "bg-gray-500/10",
    border: "border-gray-500",
    icon: <HelpCircle className="w-12 h-12 lg:w-16 lg:h-16 text-gray-500 mb-4" />,
    hint: "🤐 You are Mr. White. You have NO word. Try to figure out what everyone else is talking about!",
  },
};

export default function RoleRevealedScreen() {
  const { go, myRole, myWord, gameCategory } = useGame();

  const config = ROLE_CONFIG[myRole as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG["Civilian"];

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title="Your Role" />
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4">
        <div className="lg:max-w-lg lg:mx-auto space-y-4">

          {/* Role Card */}
          <div className={`bg-card rounded-2xl border-2 ${config.border} p-5 lg:p-7 shadow-xl`}>
            <span className="text-xs text-muted-foreground font-mono">Category — {gameCategory || "Unknown"}</span>
            <div className="flex flex-col items-center py-6 lg:py-8">
              {config.icon}
              <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-1">
                {myRole === "Mr White" ? "No Word" : "Your Disease"}
              </p>
              <p className={`text-3xl lg:text-4xl font-bold mb-4 ${config.color}`}>
                {myWord || "—"}
              </p>
              <div className={`${config.bg} border rounded-xl px-4 py-2.5 text-center max-w-xs`}>
                <p className="text-xs text-foreground/70">{config.hint}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-border flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Your Role</span>
              <span className={`text-xs font-bold ${config.bg} ${config.color} px-3 py-1 rounded-full`}>
                {config.label}
              </span>
            </div>
          </div>

        </div>
      </div>
      <PrimaryButtonBar onClick={() => go("discussion")} label="Start Discussion Phase →" maxWidth={true} />
    </div>
  );
}
