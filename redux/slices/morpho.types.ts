import { Address } from "viem";

// --------------------------------------------------------------------------------
export type MorphoState = {
	error: string | null;
	loading: boolean;

	markets: Market[];
};

// --------------------------------------------------------------------------------
export type Asset = {
	address: Address;
	decimals: number;
	name: string;
	symbol: string;
	__typename: "Asset";
};

export type MarketState = {
	borrowApy: number;
	borrowAssets: string;
	borrowAssetsUsd: number;
	fee: number;
	liquidityAssets: string;
	liquidityAssetsUsd: number;
	monthlyBorrowApy: number;
	monthlySupplyApy: number;
	price: string;
	quarterlyBorrowApy: number;
	quarterlySupplyApy: number;
	supplyApy: number;
	supplyAssets: string;
	supplyAssetsUsd: number;
	timestamp: number;
	utilization: number;
};

export type Market = {
	uniqueKey: string;
	collateralAsset: Asset;
	irmAddress: Address;
	lltv: string;
	loanAsset: Asset;
	oracleAddress: Address;
	state: MarketState;
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};

export type DispatchMarketArray = {
	type: string;
	payload: Market[];
};
