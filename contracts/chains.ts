import { Chain } from "viem";

export const ethereum3 = {
	id: 1337,
	name: "Ethereum3",
	nativeCurrency: { name: "Ethereum3", symbol: "ETH3", decimals: 18 },
	rpcUrls: {
		default: { http: ["https://ethereum3.3dotshub.com"] },
	},
	blockExplorers: {
		default: { name: "Blockscout", url: "" },
	},
} as const satisfies Chain;
