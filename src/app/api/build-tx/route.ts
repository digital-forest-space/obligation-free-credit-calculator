import { NextResponse } from "next/server";
import {
  DefaultSolanaRpcClient,
  SamsaraClient,
  getMarketByName,
  toLamports,
} from "nirvana-solana";

function getRpcUrl(): string {
  const url = process.env.SOLANA_RPC_URL;
  if (!url) throw new Error("SOLANA_RPC_URL is required");
  return url;
}

/**
 * POST /api/build-tx
 *
 * Builds an unsigned buy-and-borrow transaction for a given market.
 * Returns base64-encoded transaction bytes ready for wallet signing.
 *
 * Body: { wallet: string, marketName: string, inputAmount: number, borrowAmount: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, marketName, inputAmount, borrowAmount } = body;

    if (!wallet || !marketName || !inputAmount || !borrowAmount) {
      return NextResponse.json(
        { error: "Missing required fields: wallet, marketName, inputAmount, borrowAmount" },
        { status: 400 },
      );
    }

    const market = getMarketByName(marketName);
    if (!market) {
      return NextResponse.json(
        { error: `Unknown market: ${marketName}` },
        { status: 400 },
      );
    }

    const rpcClient = new DefaultSolanaRpcClient(getRpcUrl());
    const samsaraClient = new SamsaraClient({ rpcClient });

    const recentBlockhash = await rpcClient.getLatestBlockhash();

    const inputLamports = toLamports(inputAmount, market.baseDecimals);
    // Apply 98% safety margin to avoid overshooting borrow capacity
    const borrowLamports = toLamports(borrowAmount * 0.98, market.baseDecimals);

    const txBytes = await samsaraClient.buildUnsignedBuyAndBorrowTransaction({
      userPubkey: wallet,
      market,
      inputLamports,
      borrowLamports,
      recentBlockhash,
    });

    // Return as base64 so it can be decoded client-side
    const base64Tx = Buffer.from(txBytes).toString("base64");

    return NextResponse.json({ transaction: base64Tx });
  } catch (err) {
    console.error("build-tx error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to build transaction" },
      { status: 500 },
    );
  }
}
