"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSelectedWalletAccount } from "@solana/react";
import { MARKETS, type MarketConfig, getMarketByBaseName } from "@/lib/samsara/config";
import { calculateForward, calculateReverse, type ForwardResult, type ReverseResult } from "@/lib/samsara/calculator";
import type { AllPrices } from "@/lib/prices";
import { AssetSelector } from "./AssetSelector";
import { DirectionToggle, type Direction } from "./DirectionToggle";
import { ResultCard } from "./ResultCard";
import { WalletButton } from "./WalletButton";
import { Loader2 } from "lucide-react";

const TX_FEE_RESERVE = 0.01;

interface CalculatorProps {
  onStateChange?: (state: {
    market: MarketConfig;
    forwardResult: ForwardResult | null;
    reverseResult: ReverseResult | null;
  }) => void;
}

export function Calculator({ onStateChange }: CalculatorProps) {
  const searchParams = useSearchParams();
  const [account] = useSelectedWalletAccount();

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
    searchParams.get("amount") || "1",
  );

  const [prices, setPrices] = useState<AllPrices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [forwardResult, setForwardResult] = useState<ForwardResult | null>(null);
  const [reverseResult, setReverseResult] = useState<ReverseResult | null>(null);

  const [walletBalance, setWalletBalance] = useState<number | null>(null);

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

  useEffect(() => {
    if (!account) {
      setWalletBalance(null);
      return;
    }

    fetch("/api/balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: account.address }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.lamports) {
          setWalletBalance(Number(BigInt(data.lamports)) / 1e9);
        }
      })
      .catch(() => {});
  }, [account]);

  const compute = useCallback(() => {
    setForwardResult(null);
    setReverseResult(null);

    const num = parseFloat(amount);
    if (!num || num <= 0 || !prices) return;

    const p = prices[market.name];
    if (!p) return;

    const { buyFeeRate, borrowFeeRate } = p.fees;

    if (direction === "forward") {
      setForwardResult(
        calculateForward(num, p.marketPrice, p.floorPrice, p.baseUsdPrice, buyFeeRate, borrowFeeRate),
      );
    } else {
      const desiredCashBase = num / p.baseUsdPrice;
      setReverseResult(
        calculateReverse(desiredCashBase, p.marketPrice, p.floorPrice, p.baseUsdPrice, buyFeeRate, borrowFeeRate),
      );
    }
  }, [amount, market, direction, prices]);

  useEffect(() => {
    compute();
  }, [compute]);

  useEffect(() => {
    onStateChange?.({ market, forwardResult, reverseResult });
  }, [market, forwardResult, reverseResult, onStateChange]);

  const currentPrices = prices?.[market.name];

  const usableBalance =
    walletBalance !== null ? Math.max(0, walletBalance - TX_FEE_RESERVE) : null;

  function handleUseBalance() {
    if (usableBalance !== null && usableBalance > 0) {
      setAmount(usableBalance.toString());
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <AssetSelector selected={market} onChange={setMarket} />
        <WalletButton />
      </div>

      <DirectionToggle
        direction={direction}
        onChange={(d) => {
          setDirection(d);
          setAmount(d === "forward" ? "1" : "100");
        }}
        baseName={market.baseName}
      />

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-xs text-tertiary">
            {direction === "forward"
              ? `Amount of ${market.baseName} you have`
              : "USD amount you want as credit"}
          </label>
          {direction === "forward" && usableBalance !== null && (
            <button
              onClick={handleUseBalance}
              className="text-xs text-accent hover:text-accent-hover transition-colors cursor-pointer"
            >
              {walletBalance!.toFixed(4)} {market.baseName}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-input border border-border focus-within:border-accent transition-colors">
          {direction === "reverse" && (
            <span className="text-xl text-secondary">$</span>
          )}
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
            {direction === "forward" ? market.baseName : "USD"}
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
    </div>
  );
}
