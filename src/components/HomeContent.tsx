"use client";

import { Suspense, useState, useCallback } from "react";
import { Calculator } from "@/components/Calculator";
import { FlowPanel } from "@/components/FlowPanel";
import { OFCRolodex } from "@/components/OFCRolodex";
import { MARKETS, type MarketConfig } from "@/lib/samsara/config";
import type { ForwardResult } from "@/lib/samsara/calculator";

export function HomeContent() {
  const [market, setMarket] = useState<MarketConfig>(MARKETS.navSOL);
  const [forwardResult, setForwardResult] = useState<ForwardResult | null>(null);

  const handleStateChange = useCallback(
    (state: { market: MarketConfig; forwardResult: ForwardResult | null }) => {
      setMarket(state.market);
      setForwardResult(state.forwardResult);
    },
    [],
  );

  return (
    <div className="flex flex-col items-center px-4 py-12 md:py-20">
      <div className="max-w-xl w-full flex flex-col gap-16">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-3xl md:text-4xl font-bold inline-block mx-auto">
            <span className="block text-left text-accent">Nirvana</span>
            <span className="block text-center text-primary">Obligation Free Credit</span>
            <span className="block text-right text-primary font-normal text-xl md:text-2xl">Calculator</span>
          </h1>
        </div>
        <Suspense>
          <Calculator onStateChange={handleStateChange} />
        </Suspense>
      </div>
      <div className="max-w-xl w-full mt-8">
        <FlowPanel market={market} forwardResult={forwardResult} />
      </div>
      <div className="mt-16 text-center">
        <OFCRolodex />
      </div>
    </div>
  );
}
