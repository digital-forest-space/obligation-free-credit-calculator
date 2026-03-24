import { NextResponse } from "next/server";
import { createSolanaRpc, signature } from "@solana/kit";

function getRpcUrl(): string {
  const url = process.env.SOLANA_RPC_URL;
  if (!url) throw new Error("SOLANA_RPC_URL is required");
  return url;
}

/**
 * POST /api/confirm-tx
 *
 * Checks if a transaction has been confirmed on-chain.
 *
 * Body: { signature: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signature: sig } = body;

    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const rpc = createSolanaRpc(getRpcUrl());
    const statuses = await rpc
      .getSignatureStatuses([signature(sig)])
      .send();

    const status = statuses.value[0];

    if (!status) {
      return NextResponse.json({ confirmed: false });
    }

    if (status.err) {
      return NextResponse.json({ confirmed: false, error: String(status.err) });
    }

    const confirmed =
      status.confirmationStatus === "confirmed" ||
      status.confirmationStatus === "finalized";

    return NextResponse.json({ confirmed });
  } catch (err) {
    console.error("confirm-tx error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to check confirmation" },
      { status: 500 },
    );
  }
}
