"use client";

import { useState, useCallback } from "react";
import { useSelectedWalletAccount, useSignAndSendTransaction } from "@solana/react";
import type { UiWalletAccount } from "@wallet-standard/react";
import type { MarketConfig } from "@/lib/samsara/config";

interface ExecuteOfcResult {
  execute: (market: MarketConfig, inputAmount: number, borrowAmount: number) => Promise<void>;
  loading: boolean;
  error: string | null;
  txSignature: string | null;
}

/**
 * Must only be called when a wallet account is connected.
 * The caller is responsible for guarding: only render the component
 * using this hook when `account` is defined.
 */
export function useExecuteOfc(account: UiWalletAccount): ExecuteOfcResult {
  const signAndSend = useSignAndSendTransaction(account, "solana:mainnet");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const execute = useCallback(
    async (market: MarketConfig, inputAmount: number, borrowAmount: number) => {
      setLoading(true);
      setError(null);
      setTxSignature(null);

      try {
        // 1. Build unsigned transaction on server
        const res = await fetch("/api/build-tx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: account.address,
            marketName: market.name,
            inputAmount,
            borrowAmount,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to build transaction");
        }

        // 2. Decode base64 transaction bytes
        const txBytes = Uint8Array.from(atob(data.transaction), (c) => c.charCodeAt(0));

        // 3. Sign and send via wallet
        const { signature } = await signAndSend({ transaction: txBytes });

        // 4. Convert signature bytes to base58
        const sig = encodeBase58(new Uint8Array(signature));
        setTxSignature(sig);
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

  return { execute, loading, error, txSignature };
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
