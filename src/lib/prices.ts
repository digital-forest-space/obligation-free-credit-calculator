import { getCached, setCache } from './cache';
import { MARKETS, type MarketConfig } from './samsara/config';

const COMPANION_BASE_URL = process.env.NIRVANA_COMPANION_BASE_URL;
const PRICE_CACHE_TTL_MS = 300_000; // 5 minutes

export interface MarketPrices {
  marketPrice: number;
  floorPrice: number;
  baseUsdPrice: number;
}

export type AllPrices = Record<string, MarketPrices>;

interface CompanionEntry {
  price?: number;
  floor?: number;
}

const JUPITER_PRICE_URL = 'https://api.jup.ag/price/v2';

async function fetchUsdPrices(
  markets: MarketConfig[],
): Promise<Record<string, number>> {
  const mints = markets.map((m) => m.baseMint);
  const url = `${JUPITER_PRICE_URL}?ids=${mints.join(',')}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return {};
    const json = await res.json();
    const data: Record<string, { price: string }> = json.data ?? {};

    const result: Record<string, number> = {};
    for (const market of markets) {
      const entry = data[market.baseMint];
      if (entry?.price) {
        result[market.name] = parseFloat(entry.price);
      }
    }
    return result;
  } catch (e) {
    console.error('Jupiter price fetch error:', e);
    return {};
  }
}

async function fetchCompanionPrices(
  marketNames: string[],
): Promise<Record<string, CompanionEntry>> {
  if (!COMPANION_BASE_URL) return {};

  try {
    const url = `${COMPANION_BASE_URL}/getPrices?markets=${encodeURIComponent(marketNames.join(','))}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      console.error('Companion price fetch error:', res.status);
      return {};
    }
    return await res.json();
  } catch (e) {
    console.error('Companion price fetch error:', e);
    return {};
  }
}

export async function fetchAllPrices(): Promise<AllPrices> {
  const cacheKey = 'all-prices';
  const cached = getCached<AllPrices>(cacheKey);
  if (cached) return cached;

  const marketList = Object.values(MARKETS);
  const marketNames = Object.keys(MARKETS);

  const [companion, usdPrices] = await Promise.all([
    fetchCompanionPrices(marketNames),
    fetchUsdPrices(marketList),
  ]);

  const result: AllPrices = {};
  for (const name of marketNames) {
    const entry = companion[name];
    const usdPrice = usdPrices[name];
    if (entry?.price && entry?.floor && usdPrice) {
      result[name] = {
        marketPrice: entry.price,
        floorPrice: entry.floor,
        baseUsdPrice: usdPrice,
      };
    }
  }

  if (Object.keys(result).length > 0) {
    setCache(cacheKey, result, PRICE_CACHE_TTL_MS);
  }

  return result;
}
