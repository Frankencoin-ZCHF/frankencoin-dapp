"use client";

import { ApolloClient, InMemoryCache } from "@apollo/client";
import { mainnet } from "wagmi";

// URIs
export const URI_APP_LOCALHOST = "http://localhost:3000";
export const URI_APP_MAINNET = "https://frankencoin.com";
export const URI_APP_MAINDEV = "https://devapp.frankencoin.com";
export const URI_APP_DEVELOPER = "http://dapp.frankencoin.domain.com";

export const URI_PONDER_LOCALHOST = "http://localhost:42069";
export const URI_PONDER_MAINNET = "https://mainnetponder.frankencoin.com";
export const URI_PONDER_MAINDEV = "https://maindevponder.frankencoin.com";
export const URI_PONDER_DEVELOPER = "https://ponder.frankencoin.domain.com";

// >>>>>> SELECTED URI HERE <<<<<<
export const URI_APP_SELECTED = URI_APP_MAINNET;
export const URI_PONDER_SELECTED = URI_PONDER_MAINNET;
// >>>>>> SELECTED URI HERE <<<<<<

// API KEYS
// FIXME: move to env or white list domain
export const COINGECKO_API_KEY = "CG-8et9S7NgcRF3qDs3nghcxPz5"; // demo key @samclassix

// WAGMI CONFIG
// FIXME: move to env or white list domain
export const WAGMI_PROJECT_ID = "26fb3341cffa779adebdb59dc32b24e5";
export const WAGMI_CHAINS = [mainnet];
export const WAGMI_METADATA = {
	name: "Frankencoin",
	description: "Frankencoin Frontend Application",
	url: "https://app.frankencoin.com",
	icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// PONDER CLIENT
export const clientPonder = new ApolloClient({
	uri: URI_PONDER_SELECTED,
	cache: new InMemoryCache(),
});

// COINGECKO CLIENT
export const clientCoingecko = (query: string) => {
	const hasParams = query.includes("?");
	const uri: string = `https://api.coingecko.com${query}`;
	return fetch(hasParams ? `${uri}&${COINGECKO_API_KEY}` : `${uri}?${COINGECKO_API_KEY}`);
};
