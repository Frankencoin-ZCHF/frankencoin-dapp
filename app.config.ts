"use client";

import { ApolloClient, InMemoryCache } from "@apollo/client";
import { cookieStorage, createConfig, createStorage, http } from "@wagmi/core";
import { injected, coinbaseWallet, walletConnect } from "@wagmi/connectors";
import { mainnet, polygon, Chain } from "@wagmi/core/chains";
import axios from "axios";

export type ConfigEnv = { landing: string; app: string; api: string; ponder: string; rpc: string; wagmiId: string; chain: Chain };

// DEV: Loaded with defaults, not needed for now.
// if (!process.env.NEXT_PUBLIC_WAGMI_ID) throw new Error("Project ID is not defined");
// if (!process.env.NEXT_PUBLIC_RPC_URL_MAINNET) throw new Error("RPC URL for at least mainnet, not available");
// if (process.env.NEXT_PUBLIC_CHAIN_NAME == "polygon" && !process.env.NEXT_PUBLIC_RPC_URL_POLYGON)
// throw new Error("RPC URL for polygon (testnet), not available");

// Config
export const CONFIG: ConfigEnv = {
	landing: process.env.NEXT_PUBLIC_LANDINGPAGE_URL || "https://frankencoin.com",
	app: process.env.NEXT_PUBLIC_APP_URL || "https://app.frankencoin.com",
	api: process.env.NEXT_PUBLIC_API_URL || "https://api.frankencoin.com",
	ponder: process.env.NEXT_PUBLIC_PONDER_URL || "https://ponder.frankencoin.com",
	chain: process.env.NEXT_PUBLIC_CHAIN_NAME == "polygon" ? polygon : mainnet,
	wagmiId: process.env.NEXT_PUBLIC_WAGMI_ID || "3321ad5a4f22083fe6fe82208a4c9ddc",
	rpc:
		process.env.NEXT_PUBLIC_CHAIN_NAME == "polygon"
			? (process.env.NEXT_PUBLIC_RPC_URL_POLYGON as string) ||
			  "https://polygon-mainnet.g.alchemy.com/v2/VssZhTlQhrr8bgocJznp8xNzKegAA-AT"
			: process.env.NEXT_PUBLIC_RPC_URL_MAINNET || "https://eth-mainnet.g.alchemy.com/v2/VssZhTlQhrr8bgocJznp8xNzKegAA-AT",
};

console.log("YOU ARE USING THIS CONFIG PROFILE:");
console.log(CONFIG);

// PONDER CLIENT
export const PONDER_CLIENT = new ApolloClient({
	uri: CONFIG.ponder,
	cache: new InMemoryCache(),
});

// FRANKENCOIN API CLIENT
export const FRANKENCOIN_API_CLIENT = axios.create({
	baseURL: CONFIG.api,
});

// WAGMI CONFIG
export const WAGMI_CHAIN = CONFIG.chain;
export const WAGMI_METADATA = {
	name: "Frankencoin",
	description: "Frankencoin Frontend Application",
	url: CONFIG.landing,
	icons: ["https://avatars.githubusercontent.com/u/37784886"],
};
export const WAGMI_CONFIG = createConfig({
	chains: [WAGMI_CHAIN],
	transports: {
		[CONFIG.chain.id]: http(CONFIG.rpc),
	},
	batch: {
		multicall: {
			wait: 200,
		},
	},
	connectors: [
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
});
