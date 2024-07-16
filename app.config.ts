"use client";

import { ApolloClient, InMemoryCache } from "@apollo/client";
import { cookieStorage, createConfig, createStorage, http } from "@wagmi/core";
import { injected, coinbaseWallet, walletConnect } from "@wagmi/connectors";
import { mainnet, polygon, Chain } from "@wagmi/core/chains";
import { ethereum3 } from "./contracts/chains";
import axios from "axios";

// URIs
export const APP_URI_LANDINGPAGE = "https://frankencoin.com";
export const CONFIG: { [key: string]: { app: string; api: string; ponder: string; rpc: string; wagmiId?: string; chain: Chain } } = {
	localhost_mainnet: {
		app: "http://localhost:3000",
		api: "http://localhost:3030",
		ponder: "http://localhost:42069",
		rpc: "https://eth-mainnet.g.alchemy.com/v2/DQBbcLnV8lboEfoEpe8Z_io7u5UJfSVd",
		chain: mainnet,
	},
	localhost_ethereum3: {
		app: "http://localhost:3000",
		api: "http://localhost:3030",
		ponder: "http://localhost:42069",
		rpc: ethereum3.rpcUrls.default.http[0],
		chain: ethereum3,
	},
	localhost_polygon: {
		app: "http://localhost:3000",
		api: "http://localhost:3030",
		ponder: "http://localhost:42069",
		rpc: "https://polygon-mainnet.g.alchemy.com/v2/dhaKbi2HDlKYW1JaSHm1i_hGkE2gnA5t",
		chain: polygon,
	},
	mainnet: {
		app: "https://app.frankencoin.com",
		api: "https://api.frankencoin.com",
		ponder: "https://ponder.frankencoin.com",
		rpc: "https://eth-mainnet.g.alchemy.com/v2/DQBbcLnV8lboEfoEpe8Z_io7u5UJfSVd",
		wagmiId: "26fb3341cffa779adebdb59dc32b24e5",
		chain: mainnet,
	},
	developer: {
		app: "https://app.frankencoin.3dotshub.com",
		api: "https://api.frankencoin.3dotshub.com",
		ponder: "https://ponder.frankencoin.3dotshub.com",
		rpc: "https://eth-mainnet.g.alchemy.com/v2/DQBbcLnV8lboEfoEpe8Z_io7u5UJfSVd",
		chain: mainnet,
	},
	frankencoinOrg_mainnet: {
		app: "https://app.frankencoin.org",
		api: "https://api.frankencoin.org",
		ponder: "https://ponder.frankencoin.org",
		rpc: "https://eth-mainnet.g.alchemy.com/v2/DQBbcLnV8lboEfoEpe8Z_io7u5UJfSVd",
		chain: mainnet,
	},
	frankencoinOrg_polygon: {
		app: "https://app.polygon.frankencoin.org",
		api: "https://api.polygon.frankencoin.org",
		ponder: "https://ponder.polygon.frankencoin.org",
		rpc: "https://polygon-mainnet.g.alchemy.com/v2/dhaKbi2HDlKYW1JaSHm1i_hGkE2gnA5t",
		chain: polygon,
	},
};

// >>>>>> SELECTED URI HERE <<<<<<
export const CONFIG_SELECTED = CONFIG.localhost_polygon;
// >>>>>> SELECTED URI HERE <<<<<<

export const APP_URI_SELECTED = CONFIG_SELECTED.app;
export const API_URI_SELECTED = CONFIG_SELECTED.api;
export const PONDER_URI_SELECTED = CONFIG_SELECTED.ponder;

// PONDER CLIENT
export const PONDER_CLIENT = new ApolloClient({
	uri: CONFIG_SELECTED.ponder,
	cache: new InMemoryCache(),
});

// FRANKENCOIN API CLIENT
export const FRANKENCOIN_API_CLIENT = axios.create({
	baseURL: API_URI_SELECTED,
});

// WAGMI CONFIG
// FIXME: move to env or white list domain
export const WAGMI_CHAIN = CONFIG_SELECTED.chain;
export const WAGMI_PROJECT_ID = CONFIG_SELECTED.wagmiId ?? "26fb3341cffa779adebdb59dc32b24e5";
export const WAGMI_METADATA = {
	name: "Frankencoin",
	description: "Frankencoin Frontend Application",
	url: APP_URI_LANDINGPAGE,
	icons: ["https://avatars.githubusercontent.com/u/37784886"],
};
export const WAGMI_CONFIG = createConfig({
	chains: [WAGMI_CHAIN],
	transports: {
		[CONFIG_SELECTED.chain.id]: http(CONFIG_SELECTED.rpc),
	},
	connectors: [
		walletConnect({ projectId: WAGMI_PROJECT_ID, metadata: WAGMI_METADATA, showQrModal: false }),
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
