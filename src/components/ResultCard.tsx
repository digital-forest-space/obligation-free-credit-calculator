"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!forward && !reverse) return null;

  const baseUsdPrice = forward
    ? forward.cashUsd / forward.cashInBase
    : reverse
      ? reverse.desiredCashUsd / reverse.desiredCashBase
      : 0;

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl bg-surface border border-border">
      {forward && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-tertiary">Your obligation free credit</span>
          <span className="text-3xl font-bold text-accent">
            {fmtUsd(forward.cashUsd)}
          </span>
          <span className="text-sm text-secondary">
            {fmt(forward.cashInBase)} {market.baseName}
          </span>
        </div>
      )}

      {reverse && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-tertiary">
            {market.baseName} needed
          </span>
          <span className="text-3xl font-bold text-accent">
            {fmtUsd(reverse.assetNeeded * baseUsdPrice)}
          </span>
          <span className="text-sm text-secondary">
            {fmt(reverse.assetNeeded)} {market.baseName}
          </span>
        </div>
      )}

      <button
        onClick={() => setDetailsOpen(!detailsOpen)}
        className="flex items-center gap-1 text-xs text-tertiary hover:text-secondary transition-colors self-start"
      >
        Details
        {detailsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {detailsOpen && (
        <div className="flex flex-col gap-3">
          {forward && (
            <div className="flex flex-col gap-2 text-xs text-secondary">
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
          )}

          {reverse && (
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
          )}

          <div className="flex flex-col gap-2 pt-3 border-t border-border text-xs text-tertiary">
            <Row label="Market price" value={`${fmt(marketPrice, 6)} ${market.baseName}/${market.name}`} />
            <Row label="Floor price" value={`${fmt(floorPrice, 6)} ${market.baseName}/${market.name}`} />
          </div>
        </div>
      )}

      <ShareButton
        market={market}
        amount={forward?.inputAmount ?? reverse?.assetNeeded ?? 0}
        cash={forward?.cashInBase ?? reverse?.desiredCashBase ?? 0}
        cashUsd={forward ? forward.cashUsd : reverse ? reverse.desiredCashUsd : 0}
        amountUsd={forward ? forward.inputAmount * baseUsdPrice : reverse ? reverse.assetNeeded * baseUsdPrice : 0}
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
