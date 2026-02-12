# Frankencoin DApp

This is the frontend application for the Frankencoin protocol - a decentralized, collateral-backed stablecoin (ZCHF) on Ethereum.

## Tech Stack

-   **Framework**: Next.js 14 with TypeScript
-   **Styling**: TailwindCSS + Flowbite components
-   **State Management**: Redux Toolkit
-   **Web3**: wagmi v2 + viem for wallet connections and contract interactions
-   **Data**: Apollo Client for GraphQL, Axios for REST APIs

## Project Structure

-   `pages/` - Next.js pages (uses Pages Router, not App Router)
-   `components/` - React components organized by feature
-   `hooks/` - Custom React hooks for data fetching and Web3 interactions
-   `redux/` - Redux store configuration and slices
-   `utils/` - Utility functions and helpers
-   `public/` - Static assets including token logos in `public/coin/`
-   `app.config.ts` - Environment configuration

## Key Packages

-   `@frankencoin/zchf` - Smart contract ABIs and addresses
-   `@frankencoin/api` - API client for the Frankencoin backend
-   `@reown/appkit` - Wallet connection modal (formerly WalletConnect)

## Development Commands

```bash
yarn dev          # Start development server
yarn build        # Production build
yarn lint         # Run ESLint
yarn lint:fix     # Format with Prettier
```

## Environment Setup

Copy `.env.example` to `.env.local` and configure:

-   `NEXT_PUBLIC_CHAIN_NAME` - "mainnet" or "polygon"
-   `NEXT_PUBLIC_WAGMI_ID` - WalletConnect project ID
-   `NEXT_PUBLIC_RPC_URL_MAINNET` - Ethereum RPC URL

## Code Conventions

-   Use TypeScript strict mode
-   Format with Prettier (configured in `.prettierrc.json`)
-   Components use functional style with hooks
-   Web3 interactions go through custom hooks in `hooks/`

## Deployment

-   `main` branch deploys to app.frankencoin.com
-   `...` branch deploys to app.test.frankencoin.com
