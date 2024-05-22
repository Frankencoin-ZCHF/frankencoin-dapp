import { ApolloClient, InMemoryCache } from "@apollo/client";

export const URI_PONDER_LOCALHOST = "http://localhost:42069";
export const URI_PONDER_MAINNET = "https://mainnetponder.frankencoin.com/";
export const URI_PONDER_MAINDEV = "https://maindevponder.frankencoin.com/";
export const URI_PONDER_DEVELOPER = "https://ponder.frankencoin.domain.com/";

// >>> SELECTED PONDER URI HERE <<<
export const URI_PONDER_SELECTED = URI_PONDER_LOCALHOST;

export const client = new ApolloClient({
	uri: URI_PONDER_SELECTED,
	cache: new InMemoryCache(),
});
