import { Check } from "@phosphor-icons/react";

export function StepBar({ current, total = 3 }: { current: number; total?: number }) {
  return (
    <div className="flex items-center px-4 py-3 gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center flex-1 gap-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
            i < current ? "bg-primary text-white" :
            i === current ? "bg-primary text-white ring-4 ring-primary/20" :
            "bg-muted text-muted-foreground"}`}>
            {i < current ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          {i < total - 1 && <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${i < current ? "bg-primary" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}
