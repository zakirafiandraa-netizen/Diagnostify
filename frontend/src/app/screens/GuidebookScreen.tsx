import { motion } from "motion/react";
import { ArrowLeft, BookOpen, Users, Clock, Target, Warning as AlertTriangle } from "@phosphor-icons/react";
import { useGame } from "../context/GameContext";
import { fadeUp, staggerList } from "../animations/presets";

const ROLES = [
  {
    title: "Main Diagnose",
    percentage: "60% of players",
    description:
      "Receives the primary disease to diagnose. Your goal is to provide accurate diagnosis while identifying other roles.",
    bg: "bg-role-civilian-bg",
    border: "border-role-civilian-border",
    titleColor: "text-role-civilian",
  },
  {
    title: "Differential Diagnose",
    percentage: "30% of players",
    description:
      "Receives a similar but different disease. Must blend in while providing plausible alternative diagnoses.",
    bg: "bg-role-undercover-bg",
    border: "border-role-undercover-border",
    titleColor: "text-role-undercover",
  },
  {
    title: "Doctor Grey",
    percentage: "10% of players",
    description:
      "Receives no disease information. Must deduce from others' discussions and survive using medical knowledge.",
    bg: "bg-role-mrwhite-bg",
    border: "border-role-mrwhite-border",
    titleColor: "text-role-mrwhite",
  },
] as const;

const PHASES = [
  {
    step: 1,
    title: "Lobby Phase",
    description:
      "Players join the room and wait for the host to start the game. Minimum 4 players required.",
    color: "var(--phase-1-lobby)",
  },
  {
    step: 2,
    title: "Role Assignment",
    description:
      "Players click cards to reveal their secret roles and diseases. Keep your role hidden from others!",
    color: "var(--phase-2-roles)",
  },
  {
    step: 3,
    title: "Discussion Rounds",
    description:
      "Players share their diagnoses in chat, then vote to eliminate one player each round. Continue until 3 players remain.",
    color: "var(--phase-3-discuss)",
  },
  {
    step: 4,
    title: "Final Round",
    description:
      "Last 3 players submit treatment plans and medical innovations. Eliminated players vote for the winner.",
    color: "var(--phase-4-final)",
  },
] as const;

const TIPS = [
  {
    title: "For Main Diagnose",
    titleColor: "text-role-civilian",
    bg: "bg-role-civilian-bg",
    border: "border-role-civilian-border",
    points: [
      "Provide accurate but not overly detailed diagnoses",
      "Watch for players giving similar answers",
      "Form alliances with other Main Diagnose players",
      "Be suspicious of vague or incorrect answers",
    ],
  },
  {
    title: "For Differential Diagnose",
    titleColor: "text-role-undercover",
    bg: "bg-role-undercover-bg",
    border: "border-role-undercover-border",
    points: [
      "Give plausible alternative diagnoses",
      "Blend in with Main Diagnose players",
      "Don't be too obvious about your different disease",
      "Use medical knowledge to seem credible",
    ],
  },
  {
    title: "For Doctor Grey",
    titleColor: "text-role-mrwhite",
    bg: "bg-role-mrwhite-bg",
    border: "border-role-mrwhite-border",
    points: [
      "Listen carefully to others' diagnoses",
      "Provide general medical knowledge",
      "Avoid giving specific diagnoses early",
      "Higher rewards if you reach the final!",
    ],
  },
  {
    title: "General Tips",
    titleColor: "text-tip-general",
    bg: "bg-tip-general-bg",
    border: "border-tip-general-border",
    points: [
      "Pay attention to voting patterns",
      "Form temporary alliances",
      "Don't reveal your role too early",
      "Keep track of eliminated players' roles",
    ],
  },
] as const;

const IMPORTANT_NOTES = [
  "Keep your role and disease information secret from other players",
  "The game requires medical knowledge - study up on diseases and treatments!",
  "Eliminated players can still participate in the final voting round",
  "Real-time communication is key - stay active in discussions",
] as const;

function SectionHeader({
  icon,
  iconBg,
  iconColor,
  title,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <h2 className="font-bold text-base lg:text-lg text-foreground">{title}</h2>
    </div>
  );
}

export default function GuidebookScreen() {
  const { go } = useGame();

  return (
    <div className="min-h-screen lg:min-h-0 flex flex-col font-sans bg-background">
      <div className="flex-1 overflow-y-auto px-4 lg:px-10 py-6 lg:py-10">
        <div className="lg:max-w-4xl lg:mx-auto space-y-6 lg:space-y-8">
          {/* Back & Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => go("home")}
              className="flex items-center gap-1.5 text-black text-sm font-medium hover:opacity-70 transition-opacity mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 flex-shrink-0">
                <BookOpen className="w-6 h-6 lg:w-7 lg:h-7" />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground">
                  Diagnostify Guidebook
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">Learn the rules and roles</p>
              </div>
            </div>
          </motion.div>

          {/* Section 1: Game Overview */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="bg-card rounded-2xl p-5 lg:p-6 border border-border shadow-sm"
          >
            <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-sm border border-border">
              <h3 className="font-bold text-lg text-foreground mb-2">How to Play</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Diagnostify is a competitive multiplayer medical diagnosis game where players 
                must identify the underlying disease based on the category and their secret word. 
                Everyone except the Undercover and Mr. White receives the same medical diagnosis word.
              </p>
            </div>
            <span className="inline-block mt-4 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              Inspired from Undercover game / Werewolf
            </span>
          </motion.div>

          {/* Section 2: Player Roles */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="bg-card rounded-2xl p-5 lg:p-6 border border-border shadow-sm"
          >
            <SectionHeader
              icon={<Users className="w-4 h-4" />}
              iconBg="bg-section-roles-icon-bg"
              iconColor="text-section-roles-icon"
              title="Player Roles"
            />
            <motion.div
              variants={staggerList}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4"
            >
              {ROLES.map((role) => (
                <motion.div
                  key={role.title}
                  variants={fadeUp}
                  className={`rounded-xl p-4 lg:p-5 border shadow-sm ${role.bg} ${role.border}`}
                >
                  <h3 className={`font-bold text-sm lg:text-base mb-1 ${role.titleColor}`}>
                    {role.title}
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground mb-2.5">
                    {role.percentage}
                  </p>
                  <p className="text-xs lg:text-sm text-foreground/75 leading-relaxed">
                    {role.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Section 3: Game Phases */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="bg-card rounded-2xl p-5 lg:p-6 border border-border shadow-sm"
          >
            <SectionHeader
              icon={<Clock className="w-4 h-4" />}
              iconBg="bg-section-phases-icon-bg"
              iconColor="text-section-phases-icon"
              title="Game Phases"
            />
            <div className="space-y-4">
              {PHASES.map((phase) => (
                <div key={phase.step} className="flex gap-3.5 lg:gap-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: phase.color }}
                  >
                    {phase.step}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="font-semibold text-sm lg:text-base text-foreground mb-1">
                      {phase.title}
                    </h3>
                    <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">
                      {phase.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Section 4: Tips & Strategy */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="bg-card rounded-2xl p-5 lg:p-6 border border-border shadow-sm"
          >
            <SectionHeader
              icon={<Target className="w-4 h-4" />}
              iconBg="bg-section-tips-icon-bg"
              iconColor="text-section-tips-icon"
              title="Tips & Strategy"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              {TIPS.map((tip) => (
                <div
                  key={tip.title}
                  className={`rounded-xl p-4 lg:p-5 border shadow-sm ${tip.bg} ${tip.border}`}
                >
                  <h3 className={`font-bold text-sm lg:text-base mb-3 ${tip.titleColor}`}>
                    {tip.title}
                  </h3>
                  <div className="space-y-2 text-left">
                    {tip.points.map((point) => (
                      <p
                        key={point}
                        className="text-xs lg:text-sm text-foreground/75 leading-relaxed"
                      >
                        {point}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Section 5: Important Notes */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="bg-red-50 rounded-2xl p-5 lg:p-6 border border-red-200 shadow-sm"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <h2 className="font-bold text-base lg:text-lg text-red-800">Important Notes</h2>
            </div>
            <div className="space-y-2.5 text-left">
              {IMPORTANT_NOTES.map((note) => (
                <p
                  key={note}
                  className="text-sm lg:text-base text-red-900/80 leading-relaxed"
                >
                  {note}
                </p>
              ))}
            </div>
          </motion.div>

          {/* Ready to Play */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="flex justify-center pt-2 pb-6 lg:pb-8"
          >
            <button
              onClick={() => go("home")}
              className="w-full max-w-sm bg-guidebook-mode text-white text-base lg:text-lg font-bold py-3.5 lg:py-4 px-8 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-guidebook-mode/25"
            >
              Ready to Play!
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
