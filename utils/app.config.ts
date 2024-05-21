import { ApolloClient, InMemoryCache } from "@apollo/client";

export const URI_PONDER_LOCALHOST = "http://localhost:42069";
export const URI_PONDER_PRODUCTION = "https://ponder3.frankencoin.com/";
export const URI_PONDER_DEVELOPER = "https://dev.ponder3.frankencoin.com/";
export const URI_PONDER_SELECTED = URI_PONDER_LOCALHOST;

export const client = new ApolloClient({
	uri: URI_PONDER_SELECTED,
	cache: new InMemoryCache(),
});
