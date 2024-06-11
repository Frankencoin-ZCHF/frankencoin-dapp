import { useEffect, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import axios from "axios";
import { TokenAddresses } from "../contracts/address";

// Load all token prices at once
export const useTokenPrices = () => {
	const [loaded, setLoaded] = useLocalStorage("tokenPricesLoaded");
	const [isLoading, setIsLoading] = useState(false);
	const [tokensToFetch, setTokensToFetch] = useState<string[]>([]);

	useEffect(() => {
		const addresses = Object.values(TokenAddresses);
		// Find outdated tokens
		const tokensToFetch: string[] = [];
		for (const address of addresses) {
			const value = localStorage.getItem(address.toLowerCase());
			if (!value) tokensToFetch.push(address.toLowerCase());
			else {
				const priceData = JSON.parse(value);
				if (Date.now() - (priceData as any).timestamp < 60 * 60 * 1000) tokensToFetch.push(address.toLowerCase());
			}
		}
		setTokensToFetch(tokensToFetch);
	}, [setTokensToFetch]);

	useEffect(() => {
		if (isLoading) return;

		const fetchPrice = async () => {
			try {
				console.log("Loading prices from Coingecko");
				setIsLoading(true);
				const price = await axios.get(
					`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokensToFetch.join(
						","
					)}&vs_currencies=usd`
				);
				Object.keys(price.data).map((address) =>
					localStorage.setItem(
						address.toLowerCase(),
						JSON.stringify({
							value: price.data[address].usd,
							timestamp: Date.now(),
						})
					)
				);
				setLoaded(true);
			} catch {}
		};

		!loaded && tokensToFetch.length > 0 && void fetchPrice();
	}, [isLoading, setIsLoading, loaded, setLoaded, tokensToFetch]);
};
