"use client";

import { SelectedWalletAccountContextProvider } from "@solana/react";

const STORAGE_KEY = "sbc-wallet";

export function WalletProviders({ children }: { children: React.ReactNode }) {
  return (
    <SelectedWalletAccountContextProvider
      filterWallets={() => true}
      stateSync={{
        getSelectedWallet: () =>
          typeof window !== "undefined"
            ? localStorage.getItem(STORAGE_KEY)
            : null,
        storeSelectedWallet: (key) => localStorage.setItem(STORAGE_KEY, key),
        deleteSelectedWallet: () => localStorage.removeItem(STORAGE_KEY),
      }}
    >
      {children}
    </SelectedWalletAccountContextProvider>
  );
}
