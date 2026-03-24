import { NextResponse } from "next/server";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const JUP_API = "https://api.jup.ag/swap/v1";

function getJupiterApiKey(): string {
  const key = process.env.JUPITER_API_KEY;
  if (!key) throw new Error("JUPITER_API_KEY is required");
  return key;
}

/**
 * POST /api/build-swap-tx
 *
 * Gets a Jupiter quote and builds an unsigned swap transaction
 * to sell borrowed base token for USDC.
 *
 * Body: { wallet: string, inputMint: string, amount: number, decimals: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, inputMint, amount, decimals } = body;

    if (!wallet || !inputMint || !amount || decimals === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: wallet, inputMint, amount, decimals" },
        { status: 400 },
      );
    }

    // Convert to lamports/atomic units
    const rawAmount = Math.floor(amount * 10 ** decimals);

    // 1. Get quote
    const quoteParams = new URLSearchParams({
      inputMint,
      outputMint: USDC_MINT,
      amount: rawAmount.toString(),
      slippageBps: "100", // 1% slippage
    });

    const apiKey = getJupiterApiKey();

    const quoteRes = await fetch(`${JUP_API}/quote?${quoteParams}`, {
      headers: { "x-api-key": apiKey },
    });
    if (!quoteRes.ok) {
      const err = await quoteRes.text();
      throw new Error(`Jupiter quote failed: ${err}`);
    }
    const quoteResponse = await quoteRes.json();

    // 2. Build swap transaction
    const swapRes = await fetch(`${JUP_API}/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: wallet,
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 500000,
            priorityLevel: "high",
          },
        },
      }),
    });

    if (!swapRes.ok) {
      const err = await swapRes.text();
      throw new Error(`Jupiter swap build failed: ${err}`);
    }

    const swapData = await swapRes.json();

    return NextResponse.json({
      transaction: swapData.swapTransaction,
      outputAmount: quoteResponse.outAmount,
    });
  } catch (err) {
    console.error("build-swap-tx error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to build swap transaction" },
      { status: 500 },
    );
  }
}
