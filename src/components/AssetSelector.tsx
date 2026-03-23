"use client";

import { MARKET_LIST, type MarketConfig } from "@/lib/samsara/config";

interface AssetSelectorProps {
  selected: MarketConfig;
  onChange: (market: MarketConfig) => void;
}

export function AssetSelector({ selected, onChange }: AssetSelectorProps) {
  return (
    <div className="flex gap-2">
      {MARKET_LIST.map((market) => (
        <button
          key={market.name}
          onClick={() => onChange(market)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selected.name === market.name
              ? "bg-accent text-bg"
              : "bg-surface border border-border text-secondary hover:text-primary"
          }`}
        >
          {market.baseName}
        </button>
      ))}
    </div>
  );
}
