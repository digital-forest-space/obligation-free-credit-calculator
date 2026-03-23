import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProviders } from "@/components/WalletProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Safe Borrow Capacity — Nirvana",
  description:
    "Calculate how much obligation free credit you can obtain from your assets. 0 interest. 0 liquidation risk. 0 repayment pressure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <WalletProviders>
          <div className="min-h-screen bg-bg flex flex-col">
            <main className="flex-1">{children}</main>
          </div>
        </WalletProviders>
      </body>
    </html>
  );
}
