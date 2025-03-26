import {
	ERC20Info,
	ApiPriceERC20,
	ApiPriceERC20Mapping,
	ApiPriceMapping,
} from "@deuro/api";

// --------------------------------------------------------------------------------
export type PricesState = {
	error: string | null;
	loaded: boolean;

	coingecko: ApiPriceMapping;
	mint: ERC20Info | ApiPriceERC20;
	nativePS: ERC20Info | ApiPriceERC20;
	collateral: ApiPriceERC20Mapping;
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
