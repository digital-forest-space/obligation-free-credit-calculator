"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { MARKETS } from "@/lib/samsara/config";
import { FlowDiagram } from "./FlowDiagram";

export function FlowPanel() {
  const [activeStep, setActiveStep] = useState<0 | 1 | 2 | 3>(0);
  const market = MARKETS.navSOL;

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl bg-surface border border-border">
      <div className="flex flex-col gap-2">
        <a
          href={`https://samsara.nirvana.finance/solana/markets/${market.baseName}/trade`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-bg border border-border text-sm text-secondary hover:text-primary transition-colors"
        >
          Get your credit on Nirvana
          <ExternalLink size={14} />
        </a>
        <span className="text-xs text-tertiary text-center">— or —</span>
        <button
          onClick={() => console.log("TODO: integrate direct transaction flow")}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-bg border border-border text-sm text-secondary hover:text-primary transition-colors cursor-pointer"
        >
          Execute directly from wallet
        </button>
      </div>
      <FlowDiagram
        market={market}
        activeStep={activeStep}
        onStepClick={(step) => setActiveStep(step === activeStep ? 0 : step)}
      />
    </div>
  );
}
