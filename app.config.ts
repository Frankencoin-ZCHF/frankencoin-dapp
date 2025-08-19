"use client";

import { ApolloClient, InMemoryCache, createHttpLink, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { cookieStorage, createConfig, createStorage, http } from "@wagmi/core";
import { injected, coinbaseWallet, walletConnect } from "@wagmi/connectors";
import { mainnet, polygon, Chain } from "@wagmi/core/chains";
import axios from "axios";
import { Address } from "viem";

export type ConfigEnv = { 
	landing: string;
	app: string;
	api: string;
	ponder: string;
	ponderFallback: string;
	wagmiId: string;
	alchemyApiKey: string;
	chain: string;
	network: {
		mainnet: string;
		polygon: string;
	};
};

// DEV: Loaded with defaults, not needed for now.
// if (!process.env.NEXT_PUBLIC_WAGMI_ID) throw new Error("Project ID is not defined");
// if (!process.env.NEXT_PUBLIC_RPC_URL_MAINNET) throw new Error("RPC URL for at least mainnet, not available");
// if (process.env.NEXT_PUBLIC_CHAIN_NAME == "polygon" && !process.env.NEXT_PUBLIC_RPC_URL_POLYGON)
// throw new Error("RPC URL for polygon (testnet), not available");

// Config
export const CONFIG: ConfigEnv = {
	landing: process.env.NEXT_PUBLIC_LANDINGPAGE_URL ?? "https://deuro.com",
	app: process.env.NEXT_PUBLIC_APP_URL ?? "https://app.deuro.com",
	api: process.env.NEXT_PUBLIC_API_URL ?? "https://api.deuro.com",
	ponder: process.env.NEXT_PUBLIC_PONDER_URL ?? "https://ponder.deuro.com",
	ponderFallback: process.env.NEXT_PUBLIC_PONDER_FALLBACK_URL ?? "https://dev.ponder.deuro.com/",
	wagmiId: process.env.NEXT_PUBLIC_WAGMI_ID ?? "",
	alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? "",
	chain: process.env.NEXT_PUBLIC_CHAIN_NAME ?? "mainnet",
	network: {
		mainnet: process.env.NEXT_PUBLIC_RPC_URL_MAINNET ?? "https://eth-mainnet.g.alchemy.com/v2",
		polygon: process.env.NEXT_PUBLIC_RPC_URL_POLYGON ?? "https://polygon-mainnet.g.alchemy.com/v2",
	}
};

const PRINT_CONFIG = (): ConfigEnv => {
	const printConfig = { ...CONFIG};

	printConfig.wagmiId = TRUNCATE_STRING(printConfig.wagmiId, 5, 5);
	printConfig.alchemyApiKey = TRUNCATE_STRING(printConfig.alchemyApiKey, 5, 5);

	return printConfig;
}

const TRUNCATE_STRING = (text: string, startCount: number, endCount: number): string => {
	if (text.length <= startCount + endCount) return text;

	const first = text.slice(0, startCount);
	const last = text.slice(-endCount);

	return `${first}...${last}`;
}

// PRINT CONFIGURATION PROFILE
console.log("YOU ARE USING THIS CONFIG PROFILE:");
console.log(PRINT_CONFIG());

// CONFIG CHAIN
export const CONFIG_CHAIN = (): Chain => {
	return CONFIG.chain === "polygon" ? polygon : mainnet;
}

// CONFIG RPC
export const CONFIG_RPC = (): string => {
	return CONFIG.chain === "polygon" ? `${CONFIG.network.polygon}/${CONFIG.alchemyApiKey}` : `${CONFIG.network.mainnet}/${CONFIG.alchemyApiKey}`;
}

// Ponder fallback mechanism
let fallbackUntil: number | null = null;

function getPonderUrl(): string {
	if (fallbackUntil && Date.now() < fallbackUntil) return CONFIG.ponderFallback;
	if (fallbackUntil) fallbackUntil = null;
	return CONFIG.ponder;
}

function activateFallback(): void {
	if (!fallbackUntil) {
		fallbackUntil = Date.now() + 10 * 60 * 1000; // 10 minutes
		console.log('[Ponder] Switching to fallback for 10min:', CONFIG.ponderFallback);
	}
}

// PONDER CLIENT
const errorLink = onError(({ networkError }) => {
	if (networkError && getPonderUrl() === CONFIG.ponder) {
		activateFallback();
	}
});

const httpLink = createHttpLink({
	uri: () => getPonderUrl(),
});

export const PONDER_CLIENT = new ApolloClient({
	link: from([errorLink, httpLink]),
	cache: new InMemoryCache(),
});

// DEURO API CLIENT
export const DEURO_API_CLIENT = axios.create({
	baseURL: CONFIG.api,
});

// WAGMI CONFIG
export const WAGMI_CHAIN = CONFIG_CHAIN();
export const WAGMI_METADATA = {
	name: "dEURO",
	description: "dEURO Frontend Application",
	url: CONFIG.landing,
	icons: ["https://avatars.githubusercontent.com/u/37784886"],
};
export const WAGMI_CONFIG = createConfig({
	chains: [WAGMI_CHAIN],
	transports: {
		[WAGMI_CHAIN.id]: http(CONFIG_RPC()),
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

// MINT POSITION BLACKLIST
export const MINT_POSITION_BLACKLIST: Address[] = ["0x98725eE62833096C1c9bE26001F3cDA9a6241EF3"];
export const POSITION_NOT_BLACKLISTED = (addr: Address): boolean => {
	const r = MINT_POSITION_BLACKLIST.filter((p) => {
		return p.toLowerCase() === addr.toLowerCase();
	});
	return r.length == 0;
};
