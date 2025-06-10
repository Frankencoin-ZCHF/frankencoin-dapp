"use client";

import { ApolloClient, InMemoryCache } from "@apollo/client";
import { cookieStorage, createStorage, http } from "@wagmi/core";
import { injected, coinbaseWallet, walletConnect, safe } from "@wagmi/connectors";
import { mainnet, polygon, Chain, arbitrum, optimism, avalanche, gnosis, sonic, base, AppKitNetwork } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import axios from "axios";
import { Address } from "viem";

export type ConfigEnv = {
	verbose: boolean;
	landing: string;
	app: string;
	api: string;
	ponder: string;
	morphoGraph: string;
	rpc: string;
	wagmiId: string;
	chain: Chain;
};

// DEV: Loaded with defaults, not needed for now.
// if (!process.env.NEXT_PUBLIC_WAGMI_ID) throw new Error("Project ID is not available");
// if (!process.env.NEXT_PUBLIC_RPC_KEY) throw new Error("RPC KEY is not available");

// Config
export const CONFIG: ConfigEnv = {
	verbose: false,

	landing: process.env.NEXT_PUBLIC_LANDINGPAGE_URL || "https://frankencoin.com",
	app: process.env.NEXT_PUBLIC_APP_URL || "https://app.frankencoin.com",
	api: process.env.NEXT_PUBLIC_API_URL || "https://api.frankencoin.com",
	ponder: process.env.NEXT_PUBLIC_PONDER_URL || "https://ponder.frankencoin.com",
	morphoGraph: process.env.NEXT_PUBLIC_MORPHOGRAPH_URL || "https://blue-api.morpho.org/graphql",
	chain: process.env.NEXT_PUBLIC_PROFILE == "testnet" ? polygon : mainnet,
	wagmiId: process.env.NEXT_PUBLIC_WAGMI_ID || "3321ad5a4f22083fe6fe82208a4c9ddc",
	rpc: process.env.NEXT_PUBLIC_RPC_KEY || "dhaKbi2HDlKYW1JaSHm1i_hGkE2gnA5t",
};

console.log("YOU ARE USING THIS CONFIG PROFILE:");
console.log(CONFIG);

// PONDER CLIENT
export const PONDER_CLIENT = new ApolloClient({
	uri: CONFIG.ponder,
	cache: new InMemoryCache(),
});

export const MORPHOGRAPH_CLIENT = new ApolloClient({
	uri: CONFIG.morphoGraph,
	cache: new InMemoryCache(),
});

// FRANKENCOIN API CLIENT
export const FRANKENCOIN_API_CLIENT = axios.create({
	baseURL: CONFIG.api,
});

// WAGMI CONFIG
export const WAGMI_CHAIN = CONFIG.chain;
export const WAGMI_CHAINS: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, polygon, arbitrum, optimism, base, avalanche, gnosis, sonic];
export const WAGMI_METADATA = {
	name: "Frankencoin",
	description: "Frankencoin Frontend Application",
	url: CONFIG.app,
	icons: ["https://avatars.githubusercontent.com/u/37784886"],
};
export const WAGMI_ADAPTER = new WagmiAdapter({
	networks: WAGMI_CHAINS,
	transports: {
		[mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${CONFIG.rpc}`),
		[polygon.id]: http(`https://polygon-mainnet.g.alchemy.com/v2/${CONFIG.rpc}`),
		[optimism.id]: http(`https://opt-mainnet.g.alchemy.com/v2/${CONFIG.rpc}`),
		[arbitrum.id]: http(`https://arb-mainnet.g.alchemy.com/v2/${CONFIG.rpc}`),
		[base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${CONFIG.rpc}`),
		[avalanche.id]: http(`https://avax-mainnet.g.alchemy.com/v2/${CONFIG.rpc}`),
		[gnosis.id]: http(`https://gnosis-mainnet.g.alchemy.com/v2/${CONFIG.rpc}`),
		[sonic.id]: http(`https://sonic-mainnet.g.alchemy.com/v2/${CONFIG.rpc}`),
	},
	batch: {
		multicall: {
			wait: 200,
		},
	},
	connectors: [
		safe({
			allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/, /dhedge.org$/],
		}),
		walletConnect({ projectId: CONFIG.wagmiId, metadata: WAGMI_METADATA, showQrModal: false }),
		injected({ shimDisconnect: true }),
		coinbaseWallet({
			appName: WAGMI_METADATA.name,
			appLogoUrl: WAGMI_METADATA.icons[0],
		}),
	],
	ssr: true,
	storage: createStorage({
		storage: cookieStorage,
	}),
	projectId: CONFIG.wagmiId,
});

export const WAGMI_CONFIG = WAGMI_ADAPTER.wagmiConfig;

// MINT POSITION BLACKLIST
export const MINT_POSITION_BLACKLIST: Address[] = [
	"0x98725eE62833096C1c9bE26001F3cDA9a6241EF3",
	"0x7FF29064edc935571f89266607eAA0b5a51b795d",
];
export const POSITION_BLACKLISTED = (addr: Address): boolean => {
	const r = MINT_POSITION_BLACKLIST.filter((p) => {
		return p.toLowerCase() === addr.toLowerCase();
	});
	return r.length > 0;
};
