import type { Metadata } from "next";
import { HomeContent } from "@/components/HomeContent";

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
  return <HomeContent />;
}
