## Getting Started

### Configurations for new collateral token

1. Add token logo in **svg** or **png** format under `public/coin/` folder.
2. Make sure logo file name should be in lower case and same as real token symbol.
   e.g `public/coin/xchf.svg`

### Automatic deployment

1. The main branch should deploy to app.frankencoin.com
2. The dev Branch should deploy to dev.app.frankencoin.com

### Deploy or run with developer default keys

```Bash
# clone and install deps.
git clone https://github.com/Frankencoin-ZCHF/frankencoin-dapp.git
cd frankencoin-dapp
yarn install --frozen-lockfile

# deploy
yarn run build
yarn run start

# or run developer mode
yarn run dev
```

### Copy .env.example and adjust your environment

```TS
NEXT_PUBLIC_LANDINGPAGE_URL=https://frankencoin.com
NEXT_PUBLIC_APP_URL=https://app.frankencoin.com
NEXT_PUBLIC_API_URL=https://api.frankencoin.com
NEXT_PUBLIC_PONDER_URL=https://ponder.frankencoin.com
NEXT_PUBLIC_CHAIN_NAME=mainnet
NEXT_PUBLIC_WAGMI_ID=...
NEXT_PUBLIC_RPC_URL_MAINNET=...
NEXT_PUBLIC_RPC_URL_POLYGON=...
```

### Change default environment (app.config.ts)

```TS
// Config
export const CONFIG: ConfigEnv = {
	landing: process.env.NEXT_PUBLIC_LANDINGPAGE_URL || "https://frankencoin.com",
	app: process.env.NEXT_PUBLIC_APP_URL || "https://app.frankencoin.com",
	api: process.env.NEXT_PUBLIC_API_URL || "https://api.frankencoin.com",
	ponder: process.env.NEXT_PUBLIC_PONDER_URL || "https://ponder.frankencoin.com",
	chain: process.env.NEXT_PUBLIC_CHAIN_NAME == "polygon" ? polygon : mainnet,
	wagmiId: process.env.NEXT_PUBLIC_WAGMI_ID || "...",
	rpc:
		process.env.NEXT_PUBLIC_CHAIN_NAME == "polygon"
			? (process.env.NEXT_PUBLIC_RPC_URL_POLYGON as string) ||
			  "https://polygon-mainnet.g.alchemy.com/v2/..."
			: process.env.NEXT_PUBLIC_RPC_URL_MAINNET || "https://eth-mainnet.g.alchemy.com/v2/...",
};

console.log("YOU ARE USING THIS CONFIG PROFILE:");
console.log(CONFIG);
```

### Production

```
Environment:

node version 20
yarn v1.22.19
Next.js 14.1.4

Commands:
yarn install --frozen-lockfile
yarn build
yarn run start
```

Open <URI_APP_SELECTED> with your browser to see the result.

### Development

```
Environment:

node version 20
yarn v1.22.19
Next.js 14.1.4

Commands:
yarn install --frozen-lockfile
yarn run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Change chain

e.g. custom testnet chain

```
Memory stored private blockchain for development.
RPC: https://ethereum3.3dotshub.com
Blocktime: 10sec
```

#### Affected file: /contracts/address.ts

-   change custom chain settings
-   update SC addresses

```
[ethereum3.id]: {
   frankenCoin: "0x4800b6c288e4B2BBa7b2314328DB485F5FfB0414",
   bridge: zeroAddress,
   xchf: zeroAddress,
   equity: "0xD47DE3328848cf8fd4079673cA40510536323e59",
   mintingHub: "0x60614BE7fD2F92bf96caa61d434a4e04Af6228c3",
   wFPS: zeroAddress,
   mockWbtc: "0x1b01c6b10ca8AeD4F1e0d39319aa27183BBC1578",
   mockLseth: "0xd54Fb4EE40ca7F0FeF1cd87AC81dE3F247776209",
   mockBoss: "0x7f6c45725F521e7B5b0e3357A8Ed4152c0BBd01E",
},
```

#### Affected file: /pages/api/prices.ts

-   change addresses of ERC20 tokens
-   "hard/softcode" a price (for dev)

```
// if ethereum3 private testnet
if ((WAGMI_CHAIN.id as number) === 1337) {
   for (let erc of fetchedERC20Infos) {
      let price = { usd: 1 };

      const calc = (value: number) => {
         const ref: number = 1718033809979;
         return value * (1 + ((Date.now() - 1718033809979) / (3600 * 24)) * 0.005 + Math.random() * 0.01);
      };

      if (erc.address === ADDRESS[WAGMI_CHAIN.id].frankenCoin) price = { usd: calc(1.12) };
      if (erc.address === ADDRESS[WAGMI_CHAIN.id].mockWbtc) price = { usd: calc(69000) };
      if (erc.address === ADDRESS[WAGMI_CHAIN.id].mockLseth) price = { usd: calc(3800) };
      if (erc.address === ADDRESS[WAGMI_CHAIN.id].mockBoss) price = { usd: calc(11.54) };
```

#### Affected file: /app.config.ts

-   change app uri and ponder uri
-   **ponder needs to runs on the same chain**
-   WAGMI_PROJECT_ID e.g. ethereum3 (custom testnet chain)
-   WAGMI_CHAIN
-   add transport

```
transports: {
   [mainnet.id]: http("https://eth-mainnet.g.alchemy.com/v2/..."),
   [ethereum3.id]: http("https://ethereum3.3dotshub.com"),
},
```
