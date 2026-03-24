"use client";

import { useState, useEffect, useRef } from "react";
import { ExternalLink, Loader2, CheckCircle, RotateCcw } from "lucide-react";
import { useSelectedWalletAccount } from "@solana/react";
import type { UiWalletAccount } from "@wallet-standard/react";
import type { MarketConfig } from "@/lib/samsara/config";
import type { ForwardResult, ReverseResult } from "@/lib/samsara/calculator";
import { FlowDiagram } from "./FlowDiagram";
import { useExecuteOfc } from "@/hooks/useExecuteOfc";

interface FlowPanelProps {
  market: MarketConfig;
  forwardResult: ForwardResult | null;
  reverseResult: ReverseResult | null;
}

export function FlowPanel({ market, forwardResult, reverseResult }: FlowPanelProps) {
  const [manualStep, setManualStep] = useState<0 | 1 | 2 | 3>(0);
  const [account] = useSelectedWalletAccount();

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
        {account ? (
          <ConnectedFlowPanel
            account={account}
            market={market}
            forwardResult={forwardResult}
            reverseResult={reverseResult}
            manualStep={manualStep}
            onManualStepChange={setManualStep}
          />
        ) : (
          <>
            <button
              disabled
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-bg border border-border text-sm text-secondary opacity-40 cursor-not-allowed"
            >
              Connect wallet to execute
            </button>
            <FlowDiagram
              market={market}
              activeStep={manualStep}
              onStepClick={(step) => setManualStep(step === manualStep ? 0 : step)}
            />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Rendered only when wallet is connected, so useExecuteOfc is safe to call.
 */
function ConnectedFlowPanel({
  account,
  market,
  forwardResult,
  reverseResult,
  manualStep,
  onManualStepChange,
}: {
  account: UiWalletAccount;
  market: MarketConfig;
  forwardResult: ForwardResult | null;
  reverseResult: ReverseResult | null;
  manualStep: 0 | 1 | 2 | 3;
  onManualStepChange: (step: 0 | 1 | 2 | 3) => void;
}) {
  const { execute, reset, loading, error, step, signatures } = useExecuteOfc(account);

  const hasStarted = step > 0 || !!signatures.buy;
  const activeStep = step > 0 ? step : manualStep;
  const allDone = !!signatures.swap;
  const hasResult = !!forwardResult || !!reverseResult;

  // Derive inputAmount (SOL to buy) and maxBorrow from whichever mode is active
  const inputAmount = forwardResult
    ? forwardResult.inputAmount
    : reverseResult
      ? reverseResult.assetNeeded
      : 0;

  const maxBorrow = forwardResult
    ? forwardResult.cashInBase
    : reverseResult
      ? reverseResult.desiredCashBase
      : 0;

  // Auto-reset when user changes inputs (inputAmount or maxBorrow changes)
  const prevInputRef = useRef({ inputAmount, maxBorrow });
  useEffect(() => {
    const prev = prevInputRef.current;
    if (hasStarted && !loading && (prev.inputAmount !== inputAmount || prev.maxBorrow !== maxBorrow)) {
      reset();
      onManualStepChange(0);
    }
    prevInputRef.current = { inputAmount, maxBorrow };
  }, [inputAmount, maxBorrow, hasStarted, loading, reset, onManualStepChange]);

  const stepLabels: Record<number, string> = {
    1: "Step 1/3 — Buying navToken...",
    2: "Step 2/3 — Borrowing...",
    3: "Step 3/3 — Swapping to USDC...",
  };

  async function handleExecute() {
    if (!hasResult) return;
    await execute(market, inputAmount, maxBorrow);
  }

  function handleReset() {
    reset();
    onManualStepChange(0);
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleExecute}
          disabled={loading || !hasResult}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-bg border border-border text-sm text-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {stepLabels[step] ?? "Processing..."}
            </>
          ) : allDone ? (
            <>
              <CheckCircle size={14} className="text-accent" />
              All steps complete
            </>
          ) : !hasResult ? (
            "Enter an amount first"
          ) : (
            "Execute directly from wallet"
          )}
        </button>
        {hasStarted && !loading && (
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-bg border border-border text-sm text-secondary hover:text-primary transition-colors cursor-pointer"
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-error text-center">{error}</p>
      )}
      <FlowDiagram
        market={market}
        activeStep={activeStep as 0 | 1 | 2 | 3}
        onStepClick={(s) => onManualStepChange(s === manualStep ? 0 : s)}
        signatures={signatures}
      />
    </>
  );
}
