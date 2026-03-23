import { Suspense } from "react";
import type { Metadata } from "next";
import { Calculator } from "@/components/Calculator";
import { OFCRolodex } from "@/components/OFCRolodex";

interface PageProps {
  searchParams: Promise<{ asset?: string; amount?: string; cash?: string; dir?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const { asset, amount, cash } = params;

  if (asset && amount && cash) {
    const ogUrl = `/og?asset=${encodeURIComponent(asset)}&amount=${encodeURIComponent(amount)}&cash=${encodeURIComponent(cash)}&dir=${params.dir || 'forward'}`;
    const title = `Get ${parseFloat(cash).toFixed(2)} ${asset} obligation free credit — Obligation Free Credit Calculator`;

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
          <h1 className="text-3xl md:text-4xl font-bold inline-block mx-auto">
            <span className="block text-left text-accent">Nirvana</span>
            <span className="block text-center text-primary">Obligation Free Credit</span>
            <span className="block text-right text-primary font-normal text-xl md:text-2xl">Calculator</span>
          </h1>
        </div>
        <Suspense>
          <Calculator />
        </Suspense>
      </div>
      <div className="mt-16 text-center">
        <OFCRolodex />
      </div>
    </div>
  );
}
