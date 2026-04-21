# Frankencoin DApp

Frontend for the Frankencoin protocol — a decentralized, collateral-backed stablecoin (ZCHF) on Ethereum.

## Tech Stack

-   **Framework**: Next.js 14 with TypeScript (Pages Router — not App Router)
-   **Styling**: TailwindCSS + Flowbite components
-   **State Management**: Redux Toolkit
-   **Web3**: wagmi v2 + viem for wallet connections and contract interactions
-   **Data**: Apollo Client for GraphQL, Axios for REST APIs

## Project Structure

-   `pages/` - Route pages: index, equity, savings, swap, transfer, report, components, monitoring
-   `components/` - React components organized by feature; shared/general components live at the root level
-   `hooks/` - Custom React hooks for data fetching and Web3 interactions
-   `redux/` - Redux store configuration and slices
-   `utils/` - Utility functions: `format.ts`, `math.ts`, `helpers.ts`, `constant.ts`, `collateralCategories.ts`
-   `public/coin/` - Token logo assets
-   `app.config.ts` - Environment configuration

## Key Packages

-   `@frankencoin/zchf` - Smart contract ABIs and addresses
-   `@frankencoin/api` - API client for the Frankencoin backend
-   `@reown/appkit` - Wallet connection modal (formerly WalletConnect)

## Shared Components

General-purpose components at `components/` root level — always prefer these over building new ones:

-   **Layout**: `AppCard`, `AppBox`, `AppForm`, `AppTitle`, `AppHeroSteps`
-   **Buttons**: `AppButton`, `AppButtonSecondary`, `AppToggle`, `AppLink`, `NavButton`
-   **Display**: `DisplayAmount`, `DisplayLabel`, `DisplayOutputAlignedRight`
-   **Identity**: `TokenLogo`, `ChainLogo`, `AddressLabel`, `AppIcon`
-   **Feedback**: `LoadingScreen`, `LoadingSpin`, `TxToast`

Always reuse these components throughout the app. Extend an existing component if it almost fits; only create a new component if nothing suitable exists — and make it generic and reusable.

## Development Commands

```bash
yarn dev          # Start development server
yarn build        # Production build
yarn lint         # Run ESLint
yarn lint:fix     # Format with Prettier
```

## Environment Setup

Copy `.env.example` to `.env.local` and configure:

-   `NEXT_PUBLIC_CHAIN_NAME` - `testnet`
-   `NEXT_PUBLIC_WAGMI_ID` - WalletConnect project ID
-   `NEXT_PUBLIC_RPC_URL_MAINNET` - Ethereum RPC URL

## Code Conventions

-   Use TypeScript strict mode
-   Format with Prettier (configured in `.prettierrc.json`)
-   Components use functional style with hooks
-   Web3 interactions go through custom hooks in `hooks/`
-   Reuse shared components; extend before creating; create generic before specific

## Deployment

-   `main` branch → app.frankencoin.com
-   `...` branch → app.test.frankencoin.com
