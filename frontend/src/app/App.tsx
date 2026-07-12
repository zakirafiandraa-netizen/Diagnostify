import React, { Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import { GameProvider, useGame } from "./context/GameContext";
import { Sidebar } from "./components/layout/Sidebar";
import { pageFade } from "./animations/presets";
// Removed Screen

// Lazy-load screens for better bundle splitting
const HomeScreen = React.lazy(() => import("./screens/HomeScreen"));
const GuidebookScreen = React.lazy(() => import("./screens/GuidebookScreen"));
const AddPlayersScreen = React.lazy(() => import("./screens/AddPlayersScreen"));
const CategoryScreen = React.lazy(() => import("./screens/CategoryScreen"));
const SummaryScreen = React.lazy(() => import("./screens/SummaryScreen"));
const OnlineJoinScreen = React.lazy(() => import("./screens/OnlineJoinScreen"));
const LobbyMainScreen = React.lazy(() => import("./screens/LobbyMainScreen"));
const LobbyPlayersScreen = React.lazy(() => import("./screens/LobbyPlayersScreen"));
const ChooseRoleScreen = React.lazy(() => import("./screens/ChooseRoleScreen"));
const RoleRevealedScreen = React.lazy(() => import("./screens/RoleRevealedScreen"));
const DiscussionScreen = React.lazy(() => import("./screens/DiscussionScreen"));
const VotingScreen = React.lazy(() => import("./screens/VotingScreen"));
const FinalistScreen = React.lazy(() => import("./screens/FinalistScreen"));
const FinalSubmissionsScreen = React.lazy(() => import("./screens/FinalSubmissionsScreen"));
const GameOverScreen = React.lazy(() => import("./screens/GameOverScreen"));
const QuizScreen = React.lazy(() => import("./screens/QuizScreen"));
const FinalDiagnosisScreen = React.lazy(() => import("./screens/FinalDiagnosisScreen"));
const FinalVotingScreen = React.lazy(() => import("./screens/FinalVotingScreen"));

function AppRouter() {
  const { screen } = useGame();

  const renderScreen = () => {
    switch (screen) {
      case "home":               return <HomeScreen />;
      case "guidebook":          return <GuidebookScreen />;
      case "offline-players":    return <AddPlayersScreen />;
      case "offline-category":   return <CategoryScreen />;
      case "offline-summary":    return <SummaryScreen />;
      case "online-join":        return <OnlineJoinScreen />;
      case "lobby-main":         return <LobbyMainScreen />;
      case "lobby-players":      return <LobbyPlayersScreen />;
      case "choose-role":        return <ChooseRoleScreen />;
      case "role-revealed":      return <RoleRevealedScreen />;
      case "discussion":         return <DiscussionScreen />;
      case "voting":             return <VotingScreen />;
      case "finalist":           return <FinalistScreen />;
      case "final-submissions":  return <FinalSubmissionsScreen />;
      case "game-over":          return <GameOverScreen />;
      case "quiz":               return <QuizScreen />;
      case "final-diagnosis":    return <FinalDiagnosisScreen />;
      case "final-voting":       return <FinalVotingScreen />;
      default:                   return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily:"'DM Sans','Inter',sans-serif" }}>
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Content area */}
      <div className="flex-1 min-h-screen flex bg-muted/30 lg:bg-background justify-center lg:justify-start items-start">
        <div className="w-full max-w-sm lg:max-w-none min-h-screen bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              variants={pageFade}
              initial="initial"
              animate="animate"
              exit="exit"
              className="min-h-screen"
            >
              <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>}>
                {renderScreen()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppRouter />
    </GameProvider>
  );
}
