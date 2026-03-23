"use client";

import { ArrowRight, ArrowLeft } from "lucide-react";

export type Direction = "forward" | "reverse";

interface DirectionToggleProps {
  direction: Direction;
  onChange: (d: Direction) => void;
  baseName: string;
}

export function DirectionToggle({
  direction,
  onChange,
  baseName,
}: DirectionToggleProps) {
  return (
    <div className="flex rounded-lg bg-surface border border-border overflow-hidden">
      <button
        onClick={() => onChange("forward")}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
          direction === "forward"
            ? "bg-accent-dim text-accent"
            : "text-tertiary hover:text-secondary"
        }`}
      >
        I have {baseName}
        <ArrowRight size={12} />
        Cash
      </button>
      <button
        onClick={() => onChange("reverse")}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
          direction === "reverse"
            ? "bg-accent-dim text-accent"
            : "text-tertiary hover:text-secondary"
        }`}
      >
        I want Cash
        <ArrowLeft size={12} />
        {baseName}
      </button>
    </div>
  );
}
