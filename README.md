# Frankencoin DApp

Frontend for the [Frankencoin](https://frankencoin.com) protocol — a decentralized, oracle-free, collateral-backed stablecoin (ZCHF) on Ethereum.

Built with Next.js 14, TailwindCSS, wagmi v2, and viem.

## Requirements

-   Node 20
-   Yarn 1.22+

## Setup

```bash
git clone https://github.com/Frankencoin-ZCHF/frankencoin-dapp.git
cd frankencoin-dapp
yarn install --frozen-lockfile
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_LANDINGPAGE_URL=https://frankencoin.com
NEXT_PUBLIC_APP_URL=https://app.frankencoin.com
NEXT_PUBLIC_API_URL=https://api.frankencoin.com
NEXT_PUBLIC_PONDER_URL=https://ponder.frankencoin.com
NEXT_PUBLIC_CHAIN_NAME=mainnet
NEXT_PUBLIC_WAGMI_ID=your_walletconnect_project_id
NEXT_PUBLIC_RPC_URL_MAINNET=your_rpc_url
NEXT_PUBLIC_RPC_URL_POLYGON=your_polygon_rpc_url
```

## Development

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production

```bash
yarn build
yarn start
```

## Adding a New Collateral Token

1. Add the token logo (`svg` or `png`) to `public/coin/` — filename must be lowercase and match the token symbol exactly, e.g. `public/coin/wbtc.svg`.
2. Add end-of-year prices to the API repo's `yearly.service.ts` if applicable.

## Deployment

-   `main` → [app.frankencoin.com](https://app.frankencoin.com)
-   `...` → app.test.frankencoin.com
