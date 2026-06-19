import React from "react";

// ── InfoBanner — replaces 4+ duplicated colored banners ───────────
interface InfoBannerProps {
  color: "blue" | "orange" | "red" | "yellow";
  icon: React.ReactNode;
  title: string;
  description?: string;
}

const colorMap = {
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",  title: "text-blue-800",  desc: "text-blue-600" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", title: "text-orange-800", desc: "text-orange-600" },
  red:    { bg: "bg-red-50",    border: "border-red-200",   title: "text-red-800",   desc: "text-red-600" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", title: "text-yellow-800", desc: "text-yellow-600" },
};

export function InfoBanner({ color, icon, title, description }: InfoBannerProps) {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-4 flex gap-3`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className={`text-sm font-bold ${c.title}`}>{title}</p>
        {description && <p className={`text-xs ${c.desc} mt-0.5 leading-relaxed`}>{description}</p>}
      </div>
    </div>
  );
}

// ── BottomActionBar — replaces 8+ duplicated sticky bottom bars ───
interface BottomActionBarProps {
  children: React.ReactNode;
}

export function BottomActionBar({ children }: BottomActionBarProps) {
  return (
    <div className="p-4 lg:px-8 border-t border-border bg-card">
      {children}
    </div>
  );
}

// ── Dual bottom buttons (Back + Next) ─────────────────────────────
interface DualButtonBarProps {
  onBack: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export function DualButtonBar({ onBack, onNext, backLabel = "Back", nextLabel = "Next →", nextDisabled = false }: DualButtonBarProps) {
  return (
    <BottomActionBar>
      <div className="flex gap-3 lg:max-w-2xl lg:mx-auto">
        <button onClick={onBack} className="flex-1 border border-border text-foreground py-3 rounded-xl font-semibold text-sm hover:bg-muted/50 transition-colors">
          {backLabel}
        </button>
        <button onClick={onNext} disabled={nextDisabled}
          className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all">
          {nextLabel}
        </button>
      </div>
    </BottomActionBar>
  );
}

// ── Primary bottom button ─────────────────────────────────────────
interface PrimaryButtonBarProps {
  onClick: () => void;
  label: string;
  maxWidth?: boolean;
}

export function PrimaryButtonBar({ onClick, label, maxWidth = false }: PrimaryButtonBarProps) {
  return (
    <BottomActionBar>
      <div className={maxWidth ? "lg:max-w-2xl lg:mx-auto" : ""}>
        <button onClick={onClick}
          className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-base hover:opacity-90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all">
          {label}
        </button>
      </div>
    </BottomActionBar>
  );
}
