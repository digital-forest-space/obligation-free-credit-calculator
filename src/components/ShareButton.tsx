"use client";

import { useState } from "react";
import { Share2, Check, Twitter } from "lucide-react";
import type { MarketConfig } from "@/lib/samsara/config";

function fmtUsd(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface ShareButtonProps {
  market: MarketConfig;
  amount: number;
  cash: number;
  cashUsd: number;
  amountUsd: number;
  direction: "forward" | "reverse";
}

export function ShareButton({ market, amount, cash, cashUsd, amountUsd, direction }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const params = new URLSearchParams({
    asset: market.baseName,
    amount: amount.toString(),
    cash: cash.toString(),
    dir: direction,
  });

  function getShareUrl(): string {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}?${params.toString()}`;
  }

  function getShareText(): string {
    if (direction === "forward") {
      return `I can get ${fmtUsd(cashUsd)} in obligation free credit from ${amount} ${market.baseName} on Nirvana. 0 interest. 0 liquidation. 0 repayment pressure.`;
    }
    return `I only need ${amount} ${market.baseName} to get ${fmtUsd(cashUsd)} in obligation free credit on Nirvana. 0 interest. 0 liquidation. 0 repayment pressure.`;
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleTwitter() {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getShareUrl());
    window.open(
      `https://x.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopy}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-bg border border-border text-sm text-secondary hover:text-primary transition-colors"
      >
        {copied ? <Check size={14} /> : <Share2 size={14} />}
        {copied ? "Copied!" : "Copy Link"}
      </button>
      <button
        onClick={handleTwitter}
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-bg border border-border text-sm text-secondary hover:text-primary transition-colors"
      >
        <Twitter size={14} />
        Share
      </button>
    </div>
  );
}
