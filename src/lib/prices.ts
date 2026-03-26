import { getCached, setCache } from './cache';
import { MARKETS, type MarketConfig } from './samsara/config';

const NIRVANA_DATA_BASE_URL = process.env.NIRVANA_DATA_BASE_URL;
const PRICE_CACHE_TTL_MS = 300_000; // 5 minutes

export interface MarketFeeRates {
  buyFeeRate: number;
  borrowFeeRate: number;
}

export interface MarketPrices {
  marketPrice: number;
  floorPrice: number;
  baseUsdPrice: number;
  fees: MarketFeeRates;
}

export type AllPrices = Record<string, MarketPrices>;

interface NirvanaDataEntry {
  price?: number;
  floor?: number;
}

interface NirvanaFeeEntry {
  market: string;
  buyFeeUbps: number;
  sellFeeUbps: number;
  borrowFeeUbps: number;
}

interface NirvanaFeesResponse {
  navMarkets: NirvanaFeeEntry[];
}

async function fetchUsdPrices(
  markets: MarketConfig[],
): Promise<Record<string, number>> {
  if (!NIRVANA_DATA_BASE_URL) return {};

  try {
    const res = await fetch(`${NIRVANA_DATA_BASE_URL}/api/prices/usd`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return {};
    const data: Record<string, number> = await res.json();

    const result: Record<string, number> = {};
    for (const market of markets) {
      const price = data[market.baseName];
      if (price) {
        result[market.name] = price;
      }
    }
    return result;
  } catch (e) {
    console.error('USD price fetch error:', e);
    return {};
  }
}

async function fetchNirvanaPrices(
  marketNames: string[],
): Promise<Record<string, NirvanaDataEntry>> {
  if (!NIRVANA_DATA_BASE_URL) return {};

  try {
    const url = `${NIRVANA_DATA_BASE_URL}/api/prices?markets=${encodeURIComponent(marketNames.join(','))}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      console.error('Nirvana data price fetch error:', res.status);
      return {};
    }
    return await res.json();
  } catch (e) {
    console.error('Nirvana data price fetch error:', e);
    return {};
  }
}

const UBPS_TO_RATIO = 1_000_000;

async function fetchFees(): Promise<Record<string, MarketFeeRates>> {
  if (!NIRVANA_DATA_BASE_URL) return {};

  try {
    const res = await fetch(`${NIRVANA_DATA_BASE_URL}/api/fees`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error('Nirvana data fee fetch error:', res.status);
      return {};
    }
    const data: NirvanaFeesResponse = await res.json();

    const result: Record<string, MarketFeeRates> = {};
    for (const entry of data.navMarkets) {
      result[entry.market] = {
        buyFeeRate: entry.buyFeeUbps / UBPS_TO_RATIO,
        borrowFeeRate: entry.borrowFeeUbps / UBPS_TO_RATIO,
      };
    }
    return result;
  } catch (e) {
    console.error('Nirvana data fee fetch error:', e);
    return {};
  }
}

export async function fetchAllPrices(): Promise<AllPrices> {
  const cacheKey = 'all-prices';
  const cached = getCached<AllPrices>(cacheKey);
  if (cached) return cached;

  const marketList = Object.values(MARKETS);
  const marketNames = Object.keys(MARKETS);

  const [nirvana, usdPrices, fees] = await Promise.all([
    fetchNirvanaPrices(marketNames),
    fetchUsdPrices(marketList),
    fetchFees(),
  ]);

  // Default fees if fetch fails
  const defaultFees: MarketFeeRates = { buyFeeRate: 0.001, borrowFeeRate: 0.002 };

  const result: AllPrices = {};
  for (const name of marketNames) {
    const entry = nirvana[name];
    const usdPrice = usdPrices[name];
    if (entry?.price && entry?.floor && usdPrice) {
      result[name] = {
        marketPrice: entry.price,
        floorPrice: entry.floor,
        baseUsdPrice: usdPrice,
        fees: fees[name] ?? defaultFees,
      };
    }
  }

  if (Object.keys(result).length > 0) {
    setCache(cacheKey, result, PRICE_CACHE_TTL_MS);
  }

  return result;
}
