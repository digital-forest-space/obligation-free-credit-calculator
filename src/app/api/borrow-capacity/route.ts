import { NextResponse } from "next/server";
import {
  DefaultSolanaRpcClient,
  SamsaraClient,
  getMarketByName,
} from "nirvana-solana";

function getRpcUrl(): string {
  const url = process.env.SOLANA_RPC_URL;
  if (!url) throw new Error("SOLANA_RPC_URL is required");
  return url;
}

/**
 * POST /api/borrow-capacity
 *
 * Fetches the real on-chain borrow capacity for a user in a market.
 *
 * Body: { wallet: string, marketName: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, marketName } = body;

    if (!wallet || !marketName) {
      return NextResponse.json(
        { error: "Missing required fields: wallet, marketName" },
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

    const capacity = await samsaraClient.fetchBorrowCapacity({
      userPubkey: wallet,
      market,
    });

    if (!capacity) {
      return NextResponse.json({ error: "No position found" }, { status: 404 });
    }

    return NextResponse.json(capacity);
  } catch (err) {
    console.error("borrow-capacity error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch borrow capacity" },
      { status: 500 },
    );
  }
}
