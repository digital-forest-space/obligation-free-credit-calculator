"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { MARKETS, MARKET_LIST, type MarketConfig, getMarketByBaseName } from "@/lib/samsara/config";
import { calculateForward, calculateReverse, type ForwardResult, type ReverseResult } from "@/lib/samsara/calculator";
import type { AllPrices } from "@/lib/prices";
import { AssetSelector } from "./AssetSelector";
import { DirectionToggle, type Direction } from "./DirectionToggle";
import { ResultCard } from "./ResultCard";
import { VoteButton } from "./VoteButton";
import { WalletButton } from "./WalletButton";
import { Loader2 } from "lucide-react";

export function Calculator() {
  const searchParams = useSearchParams();

  const [market, setMarket] = useState<MarketConfig>(() => {
    const assetParam = searchParams.get("asset");
    if (assetParam) {
      const found = getMarketByBaseName(assetParam);
      if (found) return found;
    }
    return MARKETS.navSOL;
  });

  const [direction, setDirection] = useState<Direction>(() =>
    searchParams.get("dir") === "reverse" ? "reverse" : "forward",
  );

  const [amount, setAmount] = useState(() =>
    searchParams.get("amount") || "",
  );

  const [prices, setPrices] = useState<AllPrices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [forwardResult, setForwardResult] = useState<ForwardResult | null>(null);
  const [reverseResult, setReverseResult] = useState<ReverseResult | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/prices")
      .then((r) => r.json())
      .then((data) => {
        setPrices(data);
        setError("");
      })
      .catch(() => setError("Failed to load prices"))
      .finally(() => setLoading(false));
  }, []);

  const compute = useCallback(() => {
    setForwardResult(null);
    setReverseResult(null);

    const num = parseFloat(amount);
    if (!num || num <= 0 || !prices) return;

    const p = prices[market.name];
    if (!p) return;

    if (direction === "forward") {
      setForwardResult(
        calculateForward(num, p.marketPrice, p.floorPrice, p.baseUsdPrice),
      );
    } else {
      setReverseResult(
        calculateReverse(num, p.marketPrice, p.floorPrice, p.baseUsdPrice),
      );
    }
  }, [amount, market, direction, prices]);

  useEffect(() => {
    compute();
  }, [compute]);

  const currentPrices = prices?.[market.name];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <AssetSelector selected={market} onChange={setMarket} />
        <WalletButton />
      </div>

      <DirectionToggle
        direction={direction}
        onChange={setDirection}
        baseName={market.baseName}
      />

      <div className="flex flex-col gap-2">
        <label className="text-xs text-tertiary">
          {direction === "forward"
            ? `Amount of ${market.baseName} you have`
            : `Amount of ${market.baseName} you want as cash`}
        </label>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-input border border-border focus-within:border-accent transition-colors">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="any"
            className="flex-1 bg-transparent text-xl text-primary placeholder:text-tertiary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-secondary font-medium">
            {market.baseName}
          </span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-secondary text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading prices...
        </div>
      )}

      {error && (
        <div className="text-center py-4 text-error text-sm">{error}</div>
      )}

      {currentPrices && (forwardResult || reverseResult) && (
        <ResultCard
          market={market}
          forward={forwardResult ?? undefined}
          reverse={reverseResult ?? undefined}
          marketPrice={currentPrices.marketPrice}
          floorPrice={currentPrices.floorPrice}
        />
      )}

      {currentPrices && !forwardResult && !reverseResult && !loading && amount && (
        <div className="text-center py-4 text-tertiary text-sm">
          Enter a valid amount to see results
        </div>
      )}

      <VoteButton />
    </div>
  );
}
