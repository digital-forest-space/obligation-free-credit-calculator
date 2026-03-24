"use client";

import { useState, useCallback } from "react";
import { useSelectedWalletAccount } from "@solana/react";
import type { MarketConfig } from "@/lib/samsara/config";

interface ExecuteOfcResult {
  execute: (market: MarketConfig, inputAmount: number, borrowAmount: number) => Promise<void>;
  loading: boolean;
  error: string | null;
  txSignature: string | null;
  connected: boolean;
}

export function useExecuteOfc(): ExecuteOfcResult {
  const [account] = useSelectedWalletAccount();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const execute = useCallback(
    async (market: MarketConfig, inputAmount: number, borrowAmount: number) => {
      if (!account) {
        setError("Connect your wallet first");
        return;
      }

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

        // 3. Sign and send via wallet standard
        // Access the underlying wallet standard wallet object and its features
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const walletAccount = account as any;
        const wallet = walletAccount.wallet ?? walletAccount;

        // Try solana:signAndSendTransaction feature (standard Solana wallet feature)
        const features = wallet.features ?? {};
        const signAndSendFeature =
          features["solana:signAndSendTransaction"] ??
          features["standard:signAndSendTransaction"];

        if (!signAndSendFeature) {
          throw new Error(
            "Wallet does not support signing transactions. Please use a Solana wallet like Phantom or Solflare.",
          );
        }

        const output = await signAndSendFeature.signAndSendTransaction({
          account: walletAccount,
          transaction: txBytes,
          chain: "solana:mainnet",
        });

        // 4. Convert signature bytes to base58
        const sig = encodeBase58(new Uint8Array(output.signature));
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
    [account],
  );

  return { execute, loading, error, txSignature, connected: !!account };
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
