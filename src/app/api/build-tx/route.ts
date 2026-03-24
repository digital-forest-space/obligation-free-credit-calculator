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
 * Builds an unsigned transaction for a specific step of the OFC flow.
 *
 * Body:
 *   action: "buy" | "borrow"
 *   wallet: string
 *   marketName: string
 *   amount: number (base token amount for buy, borrow amount for borrow)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, wallet, marketName, amount } = body;

    if (!action || !wallet || !marketName || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: action, wallet, marketName, amount" },
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
    const lamports = toLamports(amount, market.baseDecimals);

    let txBytes: Uint8Array;

    if (action === "buy") {
      txBytes = await samsaraClient.buildUnsignedBuyNavSolTransaction({
        userPubkey: wallet,
        market,
        inputLamports: lamports,
        recentBlockhash,
      });
    } else if (action === "borrow") {
      txBytes = await samsaraClient.buildUnsignedBorrowTransaction({
        userPubkey: wallet,
        market,
        borrowLamports: lamports,
        recentBlockhash,
      });
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const base64Tx = Buffer.from(txBytes).toString("base64");

    // Also fetch borrow capacity if this was a buy (so the client knows how much to borrow next)
    let borrowCapacity: Record<string, number> | null = null;
    if (action === "buy") {
      // This returns the current on-chain capacity (before this tx lands)
      // Client will re-fetch after confirmation
    }

    return NextResponse.json({ transaction: base64Tx, borrowCapacity });
  } catch (err) {
    console.error("build-tx error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to build transaction" },
      { status: 500 },
    );
  }
}
