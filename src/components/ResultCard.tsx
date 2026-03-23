"use client";

import type { ForwardResult, ReverseResult } from "@/lib/samsara/calculator";
import type { MarketConfig } from "@/lib/samsara/config";
import { ShareButton } from "./ShareButton";

function fmt(n: number, decimals = 4): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

function fmtUsd(n: number): string {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface ResultCardProps {
  market: MarketConfig;
  forward?: ForwardResult;
  reverse?: ReverseResult;
  marketPrice: number;
  floorPrice: number;
}

export function ResultCard({
  market,
  forward,
  reverse,
  marketPrice,
  floorPrice,
}: ResultCardProps) {
  if (!forward && !reverse) return null;

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl bg-surface border border-border">
      {forward && (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-tertiary">Cash you can obtain</span>
            <span className="text-2xl font-bold text-accent">
              {fmt(forward.cashInBase)} {market.baseName}
            </span>
            <span className="text-sm text-secondary">
              {fmtUsd(forward.cashUsd)}
            </span>
          </div>

          <div className="flex flex-col gap-2 text-xs text-secondary">
            <Row
              label={`${market.baseName} input`}
              value={`${fmt(forward.inputAmount)} ${market.baseName}`}
            />
            <Row
              label={`navTokens received`}
              value={`${fmt(forward.navTokensAfterFee)} ${market.name}`}
            />
            <Row
              label="Buy fee (0.1%)"
              value={`${fmt(forward.buyFee, 6)} ${market.name}`}
            />
            <Row
              label="Borrow limit (floor)"
              value={`${fmt(forward.borrowLimit)} ${market.baseName}`}
            />
            <Row
              label="Borrow fee (0.2%)"
              value={`${fmt(forward.borrowFee, 6)} ${market.baseName}`}
            />
          </div>
        </>
      )}

      {reverse && (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-tertiary">
              {market.baseName} needed
            </span>
            <span className="text-2xl font-bold text-accent">
              {fmt(reverse.assetNeeded)} {market.baseName}
            </span>
            <span className="text-sm text-secondary">
              {fmtUsd(reverse.assetNeeded * (reverse.desiredCashUsd / reverse.desiredCashBase))}
            </span>
          </div>

          <div className="flex flex-col gap-2 text-xs text-secondary">
            <Row
              label="Desired cash"
              value={`${fmt(reverse.desiredCashBase)} ${market.baseName}`}
            />
            <Row
              label="Borrow limit needed"
              value={`${fmt(reverse.borrowLimitNeeded)} ${market.baseName}`}
            />
            <Row
              label="navTokens needed"
              value={`${fmt(reverse.navTokensNeeded)} ${market.name}`}
            />
          </div>
        </>
      )}

      <div className="flex flex-col gap-2 pt-3 border-t border-border text-xs text-tertiary">
        <Row label="Market price" value={`${fmt(marketPrice, 6)} ${market.baseName}/${market.name}`} />
        <Row label="Floor price" value={`${fmt(floorPrice, 6)} ${market.baseName}/${market.name}`} />
      </div>

      <ShareButton
        market={market}
        amount={forward?.inputAmount ?? reverse?.desiredCashBase ?? 0}
        cash={forward?.cashInBase ?? reverse?.desiredCashBase ?? 0}
        direction={forward ? "forward" : "reverse"}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="text-primary">{value}</span>
    </div>
  );
}
