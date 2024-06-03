"use client";

import { ApolloClient, InMemoryCache } from "@apollo/client";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";

// URIs
export const APP_URI_LOCALHOST = "http://localhost:3000";
export const APP_URI_MAINNET = "https://frankencoin.com";
export const APP_URI_MAINDEV = "https://devapp.frankencoin.com";
export const APP_URI_DEVELOPER = "https://dapp.frankencoin.domain.com";

export const PONDER_URI_LOCALHOST = "http://localhost:42069";
export const PONDER_URI_MAINNET = "https://mainnetponder.frankencoin.com";
export const PONDER_URI_MAINDEV = "https://maindevponder.frankencoin.com";
export const PONDER_URI_DEVELOPER = "https://ponder.frankencoin.3dotshub.com";

// >>>>>> SELECTED URI HERE <<<<<<
export const APP_URI_SELECTED = APP_URI_LOCALHOST;
export const PONDER_URI_SELECTED = PONDER_URI_DEVELOPER;
// >>>>>> SELECTED URI HERE <<<<<<

// PONDER CLIENT
export const PONDER_CLIENT = new ApolloClient({
	uri: PONDER_URI_SELECTED,
	cache: new InMemoryCache(),
});

// WAGMI CONFIG
// FIXME: move to env or white list domain
export const WAGMI_PROJECT_ID = "3321ad5a4f22083fe6fe82208a4c9ddc";
export const WAGMI_CHAIN = mainnet;
export const WAGMI_METADATA = {
	name: "Frankencoin",
	description: "Frankencoin Frontend Application",
	url: "https://app.frankencoin.com",
	icons: ["https://avatars.githubusercontent.com/u/37784886"],
};
export const WAGMI_CONFIG = createConfig({
	chains: [WAGMI_CHAIN],
	transports: {
		[WAGMI_CHAIN.id]: http("https://eth-mainnet.g.alchemy.com/v2/er3rIuivE93qMtH8e5uL6aTAFcsRsWnb"),
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
