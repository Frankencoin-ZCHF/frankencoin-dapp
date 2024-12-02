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

	collateralPositions: ApiEcosystemCollateralPositions;
	collateralStats: ApiEcosystemCollateralStats;
	depsInfo: ApiEcosystemDepsInfo;
	stablecoinInfo: ApiEcosystemStablecoinInfo;
	stablecoinMinters: ApiMinterListing;
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};

export type DispatchApiEcosystemCollateralPositions = {
	type: string;
	payload: ApiEcosystemCollateralPositions;
};

export type DispatchApiEcosystemCollateralStats = {
	type: string;
	payload: ApiEcosystemCollateralStats;
};

export type DispatchApiEcosystemFpsInfo = {
	type: string;
	payload: ApiEcosystemDepsInfo;
};

export type DispatchApiEcosystemFrankencoinInfo = {
	type: string;
	payload: ApiEcosystemStablecoinInfo;
};

export type DispatchApiEcosystemFrankencoinMinters = {
	type: string;
	payload: ApiMinterListing;
};
