"use client";

import { ApolloClient, InMemoryCache } from "@apollo/client";
import { cookieStorage, createConfig, createStorage, http } from "@wagmi/core";
import { injected, coinbaseWallet, walletConnect } from "@wagmi/connectors";
import { mainnet, Chain } from "@wagmi/core/chains";
import { ethereum3 } from "./contracts/chains";

// URIs
export const APP_URI_LANDINGPAGE = "https://frankencoin.com";
export const URIS: { [key: string]: { app: string; api: string; ponder: string; chain: Chain } } = {
	localhost: {
		app: "http://localhost:3000",
		api: "http://localhost:3030",
		ponder: "http://localhost:42069",
		chain: ethereum3,
	},
	mainnet: {
		app: "https://app.frankencoin.com",
		api: "https://api.frankencoin.com",
		ponder: "https://ponder.frankencoin.com",
		chain: mainnet,
	},
	developer: {
		app: "https://app.frankencoin.3dotshub.com",
		api: "https://api.frankencoin.3dotshub.com",
		ponder: "https://ponder.frankencoin.3dotshub.com",
		chain: mainnet,
	},
	frankencoinOrg: {
		app: "https://app.frankencoin.org",
		api: "https://api.frankencoin.org",
		ponder: "https://ponder.frankencoin.org",
		chain: mainnet,
	},
};

// >>>>>> SELECTED URI HERE <<<<<<
export const URI_SELECTED = URIS.localhost;
// >>>>>> SELECTED URI HERE <<<<<<

export const APP_URI_SELECTED = URI_SELECTED.app;
export const API_URI_SELECTED = URI_SELECTED.api;
export const PONDER_URI_SELECTED = URI_SELECTED.ponder;

// PONDER CLIENT
export const PONDER_CLIENT = new ApolloClient({
	uri: URI_SELECTED.ponder,
	cache: new InMemoryCache(),
});

// WAGMI CONFIG
// FIXME: move to env or white list domain
export const WAGMI_CHAIN = URI_SELECTED.chain;
export const WAGMI_PROJECT_ID = (WAGMI_CHAIN.id as number) === 1 ? "26fb3341cffa779adebdb59dc32b24e5" : "3321ad5a4f22083fe6fe82208a4c9ddc";
export const WAGMI_METADATA = {
	name: "Frankencoin",
	description: "Frankencoin Frontend Application",
	url: APP_URI_LANDINGPAGE,
	icons: ["https://avatars.githubusercontent.com/u/37784886"],
};
export const WAGMI_CONFIG = createConfig({
	chains: [WAGMI_CHAIN],
	transports: {
		[mainnet.id]: http("https://eth-mainnet.g.alchemy.com/v2/DQBbcLnV8lboEfoEpe8Z_io7u5UJfSVd"),
		[ethereum3.id]: http(ethereum3.rpcUrls.default.http[0]),
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

// COINGECKO API KEY
// FIXME: move to env or white list domain
export const COINGECKO_API_KEY = "CG-8et9S7NgcRF3qDs3nghcxPz5"; // demo key @samclassix

// COINGECKO CLIENT
export const COINGECKO_CLIENT = (query: string) => {
	const hasParams = query.includes("?");
	const uri: string = `https://api.coingecko.com${query}`;
	return fetch(hasParams ? `${uri}&${COINGECKO_API_KEY}` : `${uri}?${COINGECKO_API_KEY}`);
};
