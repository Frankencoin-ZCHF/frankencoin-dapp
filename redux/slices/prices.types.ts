import { ERC20Info, ApiPriceERC20, ApiPriceERC20Mapping, ApiPriceMapping, ApiPriceMarketChart } from "@frankencoin/api";

// --------------------------------------------------------------------------------
export type PricesState = {
	error: string | null;
	loaded: boolean;

	coingecko: ApiPriceMapping;
	mint: ERC20Info | ApiPriceERC20;
	fps: ERC20Info | ApiPriceERC20;
	collateral: ApiPriceERC20Mapping;
	marketChart: ApiPriceMarketChart;
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};

export type DispatchApiPriceMapping = {
	type: string;
	payload: ApiPriceMapping;
};

export type DispatchApiPriceERC20 = {
	type: string;
	payload: ApiPriceERC20;
};

export type DispatchApiPriceERC20Mapping = {
	type: string;
	payload: ApiPriceERC20Mapping;
};

export type DispatchApiPriceMarketChart = {
	type: string;
	payload: ApiPriceMarketChart;
};
