import { CaretLeft as ChevronLeft, House } from "@phosphor-icons/react";
import { useGame } from "../../context/GameContext";

interface NavBarProps {
  title?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}

export function NavBar({ title, onBack, action }: NavBarProps) {
  const { goBack, goHome, canGoBack, screen } = useGame();

  const handleBack = onBack || (canGoBack ? goBack : undefined);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-navbar">
      {handleBack ? (
        <button onClick={handleBack} className="flex items-center gap-1 text-primary text-sm font-medium hover:opacity-70 transition-opacity">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      ) : (
        <div className="w-16" />
      )}
      {title && <span className="font-semibold text-sm text-foreground">{title}</span>}
      {action ? (
        action
      ) : screen !== "home" ? (
        <button onClick={goHome} className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted" aria-label="Go to Home">
          <House className="w-4 h-4" />
        </button>
      ) : (
        <div className="w-16" />
      )}
    </div>
  );
}
