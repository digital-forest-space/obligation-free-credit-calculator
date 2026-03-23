import { Suspense } from "react";
import type { Metadata } from "next";
import { Calculator } from "@/components/Calculator";

interface PageProps {
  searchParams: Promise<{ asset?: string; amount?: string; cash?: string; dir?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const { asset, amount, cash } = params;

  if (asset && amount && cash) {
    const ogUrl = `/og?asset=${encodeURIComponent(asset)}&amount=${encodeURIComponent(amount)}&cash=${encodeURIComponent(cash)}&dir=${params.dir || 'forward'}`;
    const title = `Get ${parseFloat(cash).toFixed(2)} ${asset} free cash — Safe Borrow Capacity`;

    return {
      title,
      description: `Calculate how much free cash you can obtain from ${asset}. 0 interest. 0 liquidation risk. 0 repayment pressure.`,
      openGraph: {
        title,
        images: [{ url: ogUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        images: [ogUrl],
      },
    };
  }

  return {};
}

export default function Home() {
  return (
    <div className="flex flex-col items-center px-4 py-12 md:py-20">
      <div className="max-w-xl w-full flex flex-col gap-8">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary">
            Safe Borrow Capacity
          </h1>
          <p className="text-secondary text-sm md:text-base">
            Calculate how much free cash you can obtain from your assets.
          </p>
          <div className="flex justify-center gap-4 text-xs">
            <span className="px-3 py-1 rounded-full bg-accent-dim text-accent font-medium">
              0 Interest
            </span>
            <span className="px-3 py-1 rounded-full bg-accent-dim text-accent font-medium">
              0 Liquidation Risk
            </span>
            <span className="px-3 py-1 rounded-full bg-accent-dim text-accent font-medium">
              0 Repayment Pressure
            </span>
          </div>
        </div>
        <Suspense>
          <Calculator />
        </Suspense>
      </div>
    </div>
  );
}
