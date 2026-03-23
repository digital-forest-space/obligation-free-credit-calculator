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
    const title = `Get ${parseFloat(cash).toFixed(2)} ${asset} obligation free credit — Safe Borrow Capacity`;

    return {
      title,
      description: `Calculate how much obligation free credit you can obtain from ${asset}. 0 interest. 0 liquidation risk. 0 repayment pressure.`,
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
            Calculate how much{" "}
            <span className="relative group inline-block">
              <span className="text-accent underline decoration-dotted underline-offset-4 cursor-pointer">
                obligation free credit
              </span>
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 rounded-lg bg-surface border border-border text-xs text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                No interest. No repayment schedule. No liquidation. Ever.
              </span>
            </span>{" "}
            you can obtain from your assets.
          </p>
        </div>
        <Suspense>
          <Calculator />
        </Suspense>
      </div>
    </div>
  );
}
