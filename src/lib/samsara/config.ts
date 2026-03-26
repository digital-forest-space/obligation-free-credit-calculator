export interface MarketConfig {
  name: string;
  baseName: string;
  baseMint: string;
  navMint: string;
  mayflowerMarket: string;
  marketMetadata: string;
  baseDecimals: number;
  navDecimals: number;
  buyFeeMicrobps: number;
  borrowFeeMicrobps: number;
}


export const MARKETS: Record<string, MarketConfig> = {
  navSOL: {
    name: 'navSOL',
    baseName: 'SOL',
    baseMint: 'So11111111111111111111111111111111111111112',
    navMint: 'navSnrYJkCxMiyhM3F7K889X1u8JFLVHHLxiyo6Jjqo',
    mayflowerMarket: 'A5M1nWfi6ATSamEJ1ASr2FC87BMwijthTbNRYG7BhYSc',
    marketMetadata: 'DotD4dZAyr4Kb6AD3RHid8VgmsHUzWF6LRd4WvAMezRj',
    baseDecimals: 9,
    navDecimals: 9,
    buyFeeMicrobps: 10_000,
    borrowFeeMicrobps: 20_000,
  },
  navZEC: {
    name: 'navZEC',
    baseName: 'ZEC',
    baseMint: 'A7bdiYdS5GjqGFtxf17ppRHtDKPkkRqbKtR27dxvQXaS',
    navMint: 'navZyeDnqgHBJQjHX8Kk7ZEzwFgDXxVJBcsAXd76gVe',
    mayflowerMarket: '9SBSQvx5B8tKRgtYa3tyXeyvL3JMAZiA2JVXWzDnFKig',
    marketMetadata: 'HcGpdC8EtNpZPComvRaXDQtGHLpCFXMqfzRYeRSPCT5L',
    baseDecimals: 8,
    navDecimals: 8,
    buyFeeMicrobps: 10_000,
    borrowFeeMicrobps: 20_000,
  },
  navCBBTC: {
    name: 'navCBBTC',
    baseName: 'cbBTC',
    baseMint: 'cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij',
    navMint: 'navB4nQ2ENP18CCo1Jqw9bbLncLBC389Rf3XRCQ6zau',
    mayflowerMarket: '3WNH5EArcmVDJzi4KtaX75WiSY65mqT735GEEvqnFJ6B',
    marketMetadata: 'rQL153FrAAcepv1exoemsf9WEsC2uJaajBaaWCykvnK',
    baseDecimals: 8,
    navDecimals: 8,
    buyFeeMicrobps: 10_000,
    borrowFeeMicrobps: 20_000,
  },
  navETH: {
    name: 'navETH',
    baseName: 'WETH',
    baseMint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
    navMint: 'navEgA7saxpNqKcnJcWbCeCFMhSQtN8hQWQkK4h9scH',
    mayflowerMarket: '3AwyQgXuhQAFzMaw17V42EW2htwZknr11grEGddvZEUh',
    marketMetadata: 'XAJvRwx5PmCgCYjsKMSoSrL6MZXJtWC6dwgndFvE1uu',
    baseDecimals: 8,
    navDecimals: 8,
    buyFeeMicrobps: 10_000,
    borrowFeeMicrobps: 20_000,
  },
};

export const MARKET_KEYS = Object.keys(MARKETS);
export const MARKET_LIST = Object.values(MARKETS);

export function getMarketByBaseName(baseName: string): MarketConfig | undefined {
  return MARKET_LIST.find(
    (m) => m.baseName.toLowerCase() === baseName.toLowerCase(),
  );
}
