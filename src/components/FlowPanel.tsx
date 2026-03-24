"use client";

import { useState } from "react";
import { ExternalLink, Loader2, CheckCircle } from "lucide-react";
import type { MarketConfig } from "@/lib/samsara/config";
import type { ForwardResult } from "@/lib/samsara/calculator";
import { FlowDiagram } from "./FlowDiagram";
import { useExecuteOfc } from "@/hooks/useExecuteOfc";
interface FlowPanelProps {
  market: MarketConfig;
  forwardResult: ForwardResult | null;
}

export function FlowPanel({ market, forwardResult }: FlowPanelProps) {
  const [activeStep, setActiveStep] = useState<0 | 1 | 2 | 3>(0);
  const { execute, loading, error, txSignature, connected } = useExecuteOfc();

  async function handleExecute() {
    if (!forwardResult) return;

    setActiveStep(1);
    await execute(market, forwardResult.inputAmount, forwardResult.cashInBase);
  }

  // Update step indicator based on tx result
  const effectiveStep = txSignature ? 3 : loading ? 1 : activeStep;

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
          onClick={handleExecute}
          disabled={loading || !connected || !forwardResult}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-bg border border-border text-sm text-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Signing transaction...
            </>
          ) : txSignature ? (
            <>
              <CheckCircle size={14} className="text-accent" />
              Transaction sent
            </>
          ) : !connected ? (
            "Connect wallet to execute"
          ) : !forwardResult ? (
            "Enter an amount first"
          ) : (
            "Execute directly from wallet"
          )}
        </button>
        {txSignature && (
          <a
            href={`https://solscan.io/tx/${txSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:text-accent-hover text-center transition-colors"
          >
            View on Solscan →
          </a>
        )}
        {error && (
          <p className="text-xs text-error text-center">{error}</p>
        )}
      </div>
      <FlowDiagram
        market={market}
        activeStep={effectiveStep as 0 | 1 | 2 | 3}
        onStepClick={(step) => setActiveStep(step === activeStep ? 0 : step)}
      />
    </div>
  );
}
