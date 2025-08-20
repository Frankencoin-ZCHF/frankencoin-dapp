import {
	ApiEcosystemCollateralPositions,
	ApiEcosystemCollateralStats,
	ApiEcosystemDepsInfo,
	ApiEcosystemStablecoinInfo,
	ApiMinterListing,
} from "@deuro/api";

// --------------------------------------------------------------------------------
export type EcosystemState = {
	error: string | null;
	loaded: boolean;

	collateralPositions: ApiEcosystemCollateralPositions | undefined;
	collateralStats: ApiEcosystemCollateralStats | undefined;
	depsInfo: ApiEcosystemDepsInfo | undefined;
	stablecoinInfo: ApiEcosystemStablecoinInfo | undefined;
	stablecoinMinters: ApiMinterListing | undefined;
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};

export type DispatchApiEcosystemCollateralPositions = {
	type: string;
	payload: ApiEcosystemCollateralPositions | undefined;
};

export type DispatchApiEcosystemCollateralStats = {
	type: string;
	payload: ApiEcosystemCollateralStats | undefined;
};

export type DispatchApiEcosystemNativePoolShareInfo = {
	type: string;
	payload: ApiEcosystemDepsInfo | undefined;
};

export type DispatchApiEcosystemStablecoinInfo = {
	type: string;
	payload: ApiEcosystemStablecoinInfo | undefined;
};

export type DispatchApiEcosystemStablecoinMinters = {
	type: string;
	payload: ApiMinterListing | undefined;
};
