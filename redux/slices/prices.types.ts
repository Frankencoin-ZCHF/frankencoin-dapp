import { Address } from "viem";

export type ERC20Info = {
	address: Address;
	name: string;
	symbol: string;
	decimals: number;
};

// --------------------------------------------------------------------------------
export type PricesState = {
	error: string | null;
	loaded: boolean;

	coingecko: PriceQueryObjectArray;
	mint: ERC20Info;
	collateral: { [key: Address]: ERC20Info };
};

// --------------------------------------------------------------------------------
// TODO: Implement other currencies
export type PriceQueryCurrencies = {
	usd: number;
	// chf: number;
	// eur: number;
};

export type PriceQuery = ERC20Info & {
	timestamp: number;
	price: PriceQueryCurrencies;
};

export type PriceQueryObjectArray = {
	[key: Address]: PriceQuery;
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};

export type DispatchPriceQueryObjectArray = {
	type: string;
	payload: PriceQueryObjectArray;
};

export type DispatchERC20InfoObjectArray = {
	type: string;
	payload: { [key: Address]: ERC20Info };
};
