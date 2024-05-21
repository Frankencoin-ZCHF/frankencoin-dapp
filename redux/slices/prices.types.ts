import { Address } from 'viem';
import { ERC20Info } from './positions.types';

// --------------------------------------------------------------------------------
export type PricesState = {
	error: string | null;
	loading: boolean;

	coingecko: PriceQueryObjectArray;
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
