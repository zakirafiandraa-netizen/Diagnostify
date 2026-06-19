import { ChevronLeft } from "lucide-react";

interface NavBarProps {
  title?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}

export function NavBar({ title, onBack, action }: NavBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      {onBack
        ? <button onClick={onBack} className="flex items-center gap-1 text-primary text-sm font-medium hover:opacity-70 transition-opacity">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        : <div className="w-16" />}
      {title && <span className="font-semibold text-sm text-foreground">{title}</span>}
      {action ?? <div className="w-16" />}
    </div>
  );
}
