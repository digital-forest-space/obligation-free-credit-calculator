"use client";

import { useState, useCallback } from "react";
import { useSignAndSendTransaction } from "@solana/react";
import type { UiWalletAccount } from "@wallet-standard/react";
import type { MarketConfig } from "@/lib/samsara/config";

type Step = 0 | 1 | 2 | 3;

interface ExecuteOfcResult {
  execute: (market: MarketConfig, inputAmount: number, maxBorrow: number) => Promise<void>;
  loading: boolean;
  error: string | null;
  step: Step;
  signatures: { buy?: string; borrow?: string; swap?: string };
}

export function useExecuteOfc(account: UiWalletAccount): ExecuteOfcResult {
  const signAndSend = useSignAndSendTransaction(account, "solana:mainnet");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(0);
  const [signatures, setSignatures] = useState<{ buy?: string; borrow?: string; swap?: string }>({});

  const execute = useCallback(
    async (market: MarketConfig, inputAmount: number, maxBorrow: number) => {
      setLoading(true);
      setError(null);
      setSignatures({});

      try {
        // ── Step 1: Buy navToken ──
        setStep(1);

        const buyTx = await buildTx("buy", account.address, market.name, inputAmount);
        const buySig = await signSendAndConfirm(buyTx, signAndSend);
        setSignatures((s) => ({ ...s, buy: buySig }));

        // ── Step 2: Borrow against deposited navToken ──
        setStep(2);

        // Fetch real on-chain borrow capacity after buy confirmed
        const capacity = await fetchBorrowCapacity(account.address, market.name);
        if (!capacity || capacity.available <= 0) {
          throw new Error("No borrow capacity available after buy");
        }

        // Borrow the lesser of on-chain capacity and what the user calculated, minus 1 lamport
        const oneLamport = 1 / (10 ** market.baseDecimals);
        const borrowAmount = Math.min(capacity.available, maxBorrow) - oneLamport;
        const borrowTx = await buildTx("borrow", account.address, market.name, borrowAmount);
        const borrowSig = await signSendAndConfirm(borrowTx, signAndSend);
        setSignatures((s) => ({ ...s, borrow: borrowSig }));

        // ── Step 3: Swap borrowed tokens for USDC via Jupiter ──
        setStep(3);

        const swapTx = await buildSwapTx(account.address, market.baseMint, borrowAmount, market.baseDecimals);
        const swapSig = await signSendAndConfirm(swapTx, signAndSend);
        setSignatures((s) => ({ ...s, swap: swapSig }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        if (
          msg.includes("rejected") ||
          msg.includes("cancelled") ||
          msg.includes("denied") ||
          msg.includes("User rejected")
        ) {
          setError("Transaction cancelled");
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [account, signAndSend],
  );

  return { execute, loading, error, step, signatures };
}

// ── Helpers ──

async function buildTx(
  action: "buy" | "borrow",
  wallet: string,
  marketName: string,
  amount: number,
): Promise<string> {
  const res = await fetch("/api/build-tx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, wallet, marketName, amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Failed to build ${action} transaction`);
  return data.transaction;
}

async function buildSwapTx(
  wallet: string,
  inputMint: string,
  amount: number,
  decimals: number,
): Promise<string> {
  const res = await fetch("/api/build-swap-tx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, inputMint, amount, decimals }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to build swap transaction");
  return data.transaction;
}

async function fetchBorrowCapacity(
  wallet: string,
  marketName: string,
): Promise<{ available: number; limit: number; debt: number; deposited: number } | null> {
  const res = await fetch("/api/borrow-capacity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, marketName }),
  });
  if (res.status === 404) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch borrow capacity");
  return data;
}

type SignAndSendFn = (input: { transaction: Uint8Array }) => Promise<{ signature: Uint8Array }>;

async function signSendAndConfirm(base64Tx: string, signAndSend: SignAndSendFn): Promise<string> {
  const txBytes = Uint8Array.from(atob(base64Tx), (c) => c.charCodeAt(0));
  const { signature } = await signAndSend({ transaction: txBytes });
  const sig = encodeBase58(new Uint8Array(signature));

  // Poll for confirmation
  for (let i = 0; i < 30; i++) {
    const res = await fetch("/api/confirm-tx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature: sig }),
    });
    const data = await res.json();
    if (data.confirmed) return sig;
    if (data.error) throw new Error(`Transaction failed on-chain: ${data.error}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Transaction confirmation timed out");
}

function encodeBase58(bytes: Uint8Array): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = 0n;
  for (const byte of bytes) {
    num = num * 256n + BigInt(byte);
  }
  let str = "";
  while (num > 0n) {
    str = ALPHABET[Number(num % 58n)] + str;
    num = num / 58n;
  }
  for (const byte of bytes) {
    if (byte === 0) str = "1" + str;
    else break;
  }
  return str;
}
