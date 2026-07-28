import { FirstAid as Stethoscope, Question as HelpCircle, UserMinus as UserX, Hospital, Users } from "@phosphor-icons/react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";

const ROLE_CONFIG = {
  "Civilian": {
    label: "Verified",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary",
    icon: <Stethoscope className="w-12 h-12 lg:w-16 lg:h-16 text-primary mb-4" />,
    hint: "You got the Verified record! Blending in with the Verified, give clues about your diagnosis without saying it directly.",
  },
  "Undercover": {
    label: "Conflicted",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500",
    icon: <UserX className="w-12 h-12 lg:w-16 lg:h-16 text-red-500 mb-4" />,
    hint: "You got the Conflicted record! Blend in with the Verified. Don't get caught!",
  },
  "Mr White": {
    label: "Corrupted",
    color: "text-gray-500",
    bg: "bg-gray-500/10",
    border: "border-gray-500",
    icon: <HelpCircle className="w-12 h-12 lg:w-16 lg:h-16 text-gray-500 mb-4" />,
    hint: "You got the Corrupted record! You have NO word. Try to figure out what everyone else is talking about!",
  },
};

const ROLES = [
  {
    title: "Verified Record",
    percentage: "60% of players",
    description: "Several clinicians receive the same working diagnosis.",
    bg: "bg-role-civilian-bg",
    border: "border-role-civilian-border",
    titleColor: "text-role-civilian",
  },
  {
    title: "Conflicted Record",
    percentage: "30% of players",
    description: "A few clinicians recieve a slightly different diagnosis.",
    bg: "bg-role-undercover-bg",
    border: "border-role-undercover-border",
    titleColor: "text-role-undercover",
  },
  {
    title: "Corrupted Record",
    percentage: "10% of players",
    description: "One clinician receives no diagnostic information.",
    bg: "bg-role-mrwhite-bg",
    border: "border-role-mrwhite-border",
    titleColor: "text-role-mrwhite",
  },
] as const;

export default function RoleRevealedScreen() {
  const { go, myRole, myWord, gameCategory, caseNumber } = useGame();

  const config = ROLE_CONFIG[myRole as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG["Civilian"];

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title="Your Role" />
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4">
        <div className="lg:max-w-lg lg:mx-auto space-y-4 pb-6">

          {/* Hospital Information System Box */}
          <div className="p-3.5 lg:p-4 rounded-2xl border-2 border-primary/20 bg-card/90 shadow-md backdrop-blur-sm flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-primary font-bold tracking-wider text-xs lg:text-sm">
              <Hospital className="w-5 h-5 lg:w-6 lg:h-6 shrink-0" />
              <span>HOSPITAL INFORMATION SYSTEM</span>
            </div>
            <div className="font-mono text-xs lg:text-sm font-extrabold text-foreground bg-muted/80 px-3 py-1 rounded-lg border border-border/60 tracking-wide shrink-0">
              CASE #{caseNumber}
            </div>
          </div>

          {/* Role Card */}
          <div className={`bg-card rounded-2xl border-2 ${config.border} p-5 lg:p-7 shadow-xl`}>
            <span className="text-xs text-muted-foreground font-mono">System — {gameCategory || "Unknown"}</span>
            <div className="flex flex-col items-center py-6 lg:py-8">
              {config.icon}
              <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-1">
                {myRole === "Mr White" ? "No Word" : "Your Assigned Diagnosis"}
              </p>
              <p className={`text-3xl lg:text-4xl font-bold mb-4 ${config.color}`}>
                {myWord || "—"}
              </p>
              <div className={`${config.bg} border rounded-xl px-4 py-2.5 text-center max-w-xs`}>
                <p className="text-xs text-foreground/70">{config.hint}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-border flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Your Records</span>
              <span className={`text-xs font-bold ${config.bg} ${config.color} px-3 py-1 rounded-full`}>
                {config.label}
              </span>
            </div>
          </div>

          {/* Start Discussion Phase Button */}
          <button
            onClick={() => go("discussion")}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-base hover:opacity-90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
          >
            Start Discussion Phase →
          </button>

          {/* Roles Information Box */}
          <div className="bg-card rounded-2xl p-4 lg:p-5 border border-border shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Record Status Overview</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {ROLES.map((role) => (
                <div
                  key={role.title}
                  className={`rounded-xl p-3.5 lg:p-4 border shadow-sm ${role.bg} ${role.border}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-bold text-sm ${role.titleColor}`}>
                      {role.title}
                    </h4>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {role.percentage}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/75 leading-relaxed">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
