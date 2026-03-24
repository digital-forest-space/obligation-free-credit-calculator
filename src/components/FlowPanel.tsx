"use client";

import { useState } from "react";
import { ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { useSelectedWalletAccount } from "@solana/react";
import type { UiWalletAccount } from "@wallet-standard/react";
import type { MarketConfig } from "@/lib/samsara/config";
import type { ForwardResult } from "@/lib/samsara/calculator";
import { FlowDiagram } from "./FlowDiagram";
import { useExecuteOfc } from "@/hooks/useExecuteOfc";

interface FlowPanelProps {
  market: MarketConfig;
  forwardResult: ForwardResult | null;
}

export function FlowPanel({ market, forwardResult }: FlowPanelProps) {
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
          <ExecuteButton
            account={account}
            market={market}
            forwardResult={forwardResult}
            onStepChange={setManualStep}
          />
        ) : (
          <button
            disabled
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-bg border border-border text-sm text-secondary opacity-40 cursor-not-allowed"
          >
            Connect wallet to execute
          </button>
        )}
      </div>
      <FlowDiagram
        market={market}
        activeStep={manualStep}
        onStepClick={(step) => setManualStep(step === manualStep ? 0 : step)}
      />
    </div>
  );
}

function ExecuteButton({
  account,
  market,
  forwardResult,
  onStepChange,
}: {
  account: UiWalletAccount;
  market: MarketConfig;
  forwardResult: ForwardResult | null;
  onStepChange: (step: 0 | 1 | 2 | 3) => void;
}) {
  const { execute, loading, error, step, signatures } = useExecuteOfc(account);

  if (step > 0) onStepChange(step);

  const allDone = !!signatures.swap;

  const stepLabels: Record<number, string> = {
    1: "Step 1/3 — Buying navToken...",
    2: "Step 2/3 — Borrowing...",
    3: "Step 3/3 — Swapping to USDC...",
  };

  async function handleExecute() {
    if (!forwardResult) return;
    await execute(market, forwardResult.inputAmount, forwardResult.cashInBase);
  }

  return (
    <>
      <button
        onClick={handleExecute}
        disabled={loading || !forwardResult}
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-bg border border-border text-sm text-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
        ) : !forwardResult ? (
          "Enter an amount first"
        ) : (
          "Execute directly from wallet"
        )}
      </button>
      {signatures.buy && (
        <a
          href={`https://solscan.io/tx/${signatures.buy}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:text-accent-hover text-center transition-colors"
        >
          Step 1 — Buy tx →
        </a>
      )}
      {signatures.borrow && (
        <a
          href={`https://solscan.io/tx/${signatures.borrow}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:text-accent-hover text-center transition-colors"
        >
          Step 2 — Borrow tx →
        </a>
      )}
      {signatures.swap && (
        <a
          href={`https://solscan.io/tx/${signatures.swap}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:text-accent-hover text-center transition-colors"
        >
          Step 3 — Swap tx →
        </a>
      )}
      {error && (
        <p className="text-xs text-error text-center">{error}</p>
      )}
    </>
  );
}
