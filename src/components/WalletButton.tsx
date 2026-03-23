"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelectedWalletAccount } from "@solana/react";
import { useConnect, useDisconnect } from "@wallet-standard/react";
import type { UiWallet } from "@wallet-standard/react";
import { Wallet } from "lucide-react";

const CONNECT_FEATURE = "standard:connect" as const;

function supportsConnect(wallet: UiWallet): boolean {
  return wallet.features.includes(CONNECT_FEATURE);
}

function WalletOption({
  wallet,
  onConnected,
}: {
  wallet: UiWallet;
  onConnected: () => void;
}) {
  const [isConnecting, connect] = useConnect(wallet);
  const [, setAccount] = useSelectedWalletAccount();

  const handleClick = useCallback(async () => {
    try {
      const accounts = await connect();
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        onConnected();
      }
    } catch (e) {
      console.error("Wallet connect failed:", e);
    }
  }, [connect, setAccount, onConnected]);

  return (
    <button
      onClick={handleClick}
      disabled={isConnecting}
      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-primary hover:bg-border/50 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={wallet.icon} alt="" className="w-5 h-5 rounded" />
      <span>{wallet.name}</span>
    </button>
  );
}

function DisconnectButton({
  wallet,
  onDisconnected,
}: {
  wallet: UiWallet;
  onDisconnected: () => void;
}) {
  const [, disconnect] = useDisconnect(wallet);

  return (
    <button
      onClick={async () => {
        try {
          await disconnect();
        } catch (e) {
          console.error("Wallet disconnect failed:", e);
        } finally {
          onDisconnected();
        }
      }}
      className="w-full px-3 py-2 text-sm text-red-400 hover:bg-border/50 rounded-md transition-colors text-left cursor-pointer"
    >
      Disconnect
    </button>
  );
}

export function WalletButton() {
  const [account, setAccount, wallets] = useSelectedWalletAccount();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const connectableWallets = useMemo(() => {
    const seen = new Set<string>();
    return wallets.filter((w) => {
      if (seen.has(w.name) || !supportsConnect(w)) return false;
      seen.add(w.name);
      return true;
    });
  }, [wallets]);

  const matchedWallet = account
    ? wallets.find((w) => w.accounts.some((a) => a === account))
    : null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-sm text-secondary hover:text-primary transition-colors cursor-pointer"
      >
        <Wallet size={14} />
        {account
          ? `${account.address.slice(0, 4)}...${account.address.slice(-4)}`
          : "Connect Wallet"}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-lg shadow-lg p-1.5 z-50">
          {account && matchedWallet ? (
            <DisconnectButton
              wallet={matchedWallet}
              onDisconnected={() => {
                setAccount(undefined);
                setOpen(false);
              }}
            />
          ) : (
            <>
              {connectableWallets.length === 0 && (
                <p className="px-3 py-2 text-xs text-tertiary">
                  No wallets detected
                </p>
              )}
              {connectableWallets.map((w) => (
                <WalletOption
                  key={w.name}
                  wallet={w}
                  onConnected={() => setOpen(false)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
