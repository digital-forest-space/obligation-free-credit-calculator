# Safe Borrow Capacity Calculator — Implementation Plan

## Context

Build a web tool for Nirvana Samsara markets that lets users calculate how much "free cash" they can obtain from their assets via the navToken → borrow flow, emphasizing 0 interest, 0 liquidation risk, 0 repayment pressure. Users can share results via dynamic OG images, optionally connect a wallet, and vote for unsupported assets.

## Tech Stack

- **Framework**: Next.js (matching hardig_web/hardig_promo_landing patterns)
- **Styling**: Tailwind CSS v4
- **RPC**: `@solana/kit` via Helius, 5-min in-memory cache
- **Wallet**: `@solana/react` + `@wallet-standard/react` (optional connect)
- **Database**: Turso (`@libsql/client`) for asset votes
- **OG Images**: `@vercel/og` (Satori) for dynamic share cards
- **Deploy**: Vercel

## Architecture

```
src/
├── app/
│   ├── layout.tsx              # Root layout + WalletProviders
│   ├── page.tsx                # Main calculator page
│   ├── og/
│   │   └── route.tsx           # Dynamic OG image endpoint
│   └── api/
│       ├── prices/
│       │   └── route.ts        # GET: cached market+floor prices for all assets
│       └── votes/
│           └── route.ts        # POST: submit vote, GET: vote counts
├── components/
│   ├── Calculator.tsx          # Main calculator UI (asset select, amount input, results)
│   ├── ResultCard.tsx          # Displays calculation breakdown + share button
│   ├── AssetSelector.tsx       # Dropdown/cards for SOL/ZEC/cbBTC/ETH
│   ├── DirectionToggle.tsx     # Toggle: "I have X asset" vs "I want $X cash"
│   ├── ShareButton.tsx         # Copy share URL with OG preview
│   ├── WalletButton.tsx        # Optional wallet connect/disconnect
│   ├── VoteButton.tsx          # "Vote for an asset" modal/form
│   └── WalletProviders.tsx     # Reuse pattern from hardig projects
├── lib/
│   ├── samsara/
│   │   ├── config.ts           # Market metadata (names, mints, decimals, fees)
│   │   └── calculator.ts       # Borrow capacity math (both directions)
│   ├── prices.ts               # Fetch from Companion cloud function + Jupiter for USD
│   ├── cache.ts                # In-memory TTL cache (reuse hardig pattern)
│   ├── rpc.ts                  # Solana RPC singleton (for wallet balance checks)
│   └── turso.ts                # Turso client singleton (reuse hardig pattern)
```

## Calculation Logic

### Forward: Asset Amount → Cash

```
1. inputAmount (e.g., 10 SOL)
2. navTokens = inputAmount / marketPrice         (how many navTokens you get)
3. buyFee = navTokens * 0.001                    (0.1% buy fee)
4. navTokensAfterFee = navTokens - buyFee
5. borrowLimit = navTokensAfterFee * floorPrice  (100% LTV against floor)
6. borrowFee = borrowLimit * 0.002               (0.2% borrow fee)
7. cashObtained = borrowLimit - borrowFee        (in base token units)
8. cashUSD = cashObtained * baseTokenUSDPrice    (for display)
```

### Reverse: Desired Cash → Asset Needed

```
1. desiredCash (e.g., 100 SOL worth)
2. borrowLimitNeeded = desiredCash / (1 - 0.002)  (account for borrow fee)
3. navTokensNeeded = borrowLimitNeeded / floorPrice
4. navTokensBeforeFee = navTokensNeeded / (1 - 0.001)  (account for buy fee)
5. assetNeeded = navTokensBeforeFee * marketPrice
```

### Price Sources (all server-side, cached 5 min)

- **Floor + Market price**: Call existing Nirvana Companion cloud function (`getPrices`) — already deployed, returns `{ price, floor }` per market. Reuse pattern from `hardig_web/src/app/api/market-prices/route.ts`.
- **USD price**: Jupiter Price API (free, Solana-native, cached alongside)

## Key Files to Reuse (Patterns From)

| Pattern | Source | Path |
|---------|--------|------|
| RPC singleton | hardig_web | `hardig_web/src/lib/rpc.ts` |
| In-memory cache | hardig_web | `hardig_web/src/lib/cache.ts` |
| Turso client | hardig_promo_landing | `hardig_promo_landing/src/lib/turso.ts` |
| WalletProviders | hardig_web | `hardig_web/src/components/WalletProviders.tsx` |
| Next.js config (CSP) | hardig_promo_landing | `hardig_promo_landing/next.config.ts` |
| Market addresses | nirvana_solana | `nirvana_solana/lib/src/samsara/config.dart` |
| Price proxy route | hardig_web | `hardig_web/src/app/api/market-prices/route.ts` |

## API Endpoints

### `GET /api/prices`
Returns cached prices for all 4 markets:
```json
{
  "navSOL": { "marketPrice": 0.98, "floorPrice": 0.95, "baseUsdPrice": 145.20 },
  "navZEC": { ... },
  ...
}
```
Server-side only. 5-min in-memory cache. Calls Companion cloud function + Jupiter.

### `GET/POST /api/votes`
- GET: Returns vote counts per asset suggestion
- POST: `{ asset: "BONK" }` — records a vote (rate-limited, one per IP per asset)

### `GET /og?asset=SOL&amount=10&cash=9.2`
Returns a dynamic PNG image (1200x630) showing the calculation result, styled for social sharing.

## OG Image / Sharing

URL format: `https://domain.com/?asset=SOL&amount=10`
- When URL has params, the page pre-fills the calculator
- OG meta tags point to `/og?asset=SOL&amount=10&cash=9.2`
- Share button copies the URL and optionally opens Twitter/X intent

## Database Schema (Turso)

```sql
CREATE TABLE IF NOT EXISTS asset_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_name TEXT NOT NULL,
  voter_ip TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(asset_name, voter_ip)
);
CREATE INDEX IF NOT EXISTS idx_asset_votes_name ON asset_votes(asset_name);
```

## Implementation Order

1. **Project scaffold** — Next.js, Tailwind, tsconfig, env vars, package.json
2. **Core lib** — config.ts, rpc.ts, cache.ts, turso.ts
3. **Price fetching** — Companion cloud function proxy + Jupiter USD prices
4. **Calculator logic** — forward + reverse calculations
5. **API routes** — /api/prices, /api/votes
6. **UI components** — Calculator, AssetSelector, DirectionToggle, ResultCard
7. **Wallet integration** — WalletProviders, WalletButton, auto-detect holdings
8. **Share feature** — OG image route, ShareButton, URL params
9. **Vote feature** — VoteButton, Turso integration
10. **Polish** — CSP headers, rate limiting, error states, responsive design

## Verification

1. `npm run dev` — app loads, calculator works with cached prices
2. Select each asset, enter amounts, verify calculations match expected output
3. Toggle direction (asset→cash vs cash→asset), verify reverse calc
4. Connect wallet, verify it auto-detects holdings
5. Click share, verify OG image renders at `/og?...`
6. Submit a vote, verify it persists in Turso
7. `npm run build` — no type errors, builds cleanly

## Key Simplification

**Prices**: Instead of reimplementing on-chain price parsing in TypeScript, we call the existing **Nirvana Companion cloud function** (`getPrices`) which already handles transaction parsing, floor price decoding, and caching. This is exactly what `hardig_web` does at its market-prices route. USD prices come from Jupiter Price API.

**Markets to support**: All 4 active Samsara markets: navSOL, navZEC, navCBBTC, navETH. The Companion function endpoint accepts a `markets` query param.
