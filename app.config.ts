import { ApolloClient, InMemoryCache } from "@apollo/client";

// URIs
export const URI_APP_LOCALHOST = "http://localhost:3000";
export const URI_APP_MAINNET = "https://frankencoin.com";
export const URI_APP_MAINDEV = "https://devapp.frankencoin.com";
export const URI_APP_DEVELOPER = "http://dapp.frankencoin.domain.com";

export const URI_PONDER_LOCALHOST = "http://localhost:42069";
export const URI_PONDER_MAINNET = "https://mainnetponder.frankencoin.com/";
export const URI_PONDER_MAINDEV = "https://maindevponder.frankencoin.com/";
export const URI_PONDER_DEVELOPER = "https://ponder.frankencoin.domain.com/";

// API KEYS
// FIXME: move to env or white list domain in coingecko dashboard
const COINGECKO_API_KEY = "CG-8et9S7NgcRF3qDs3nghcxPz5"; // demo key

// >>> SELECTED PONDER URI HERE <<<
export const URI_APP_SELECTED = URI_APP_MAINDEV;
export const URI_PONDER_SELECTED = URI_PONDER_MAINDEV;

// PONDER
export const clientPonder = new ApolloClient({
	uri: URI_PONDER_SELECTED,
	cache: new InMemoryCache(),
});

// COINGECKO
export const clientCoingecko = (query: string) => {
	const hasParams = query.includes("?");
	const uri: string = `https://api.coingecko.com${query}`;
	return fetch(hasParams ? `${uri}&${COINGECKO_API_KEY}` : `${uri}?${COINGECKO_API_KEY}`);
};
