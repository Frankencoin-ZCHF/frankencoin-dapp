import {
	ApiEcosystemCollateralPositions,
	ApiEcosystemCollateralStats,
	ApiEcosystemFpsInfo,
	ApiEcosystemFrankencoinInfo,
	ApiMinterListing,
} from "@frankencoin/api";

// --------------------------------------------------------------------------------
export type EcosystemState = {
	error: string | null;
	loaded: boolean;

	collateralPositions: ApiEcosystemCollateralPositions;
	collateralStats: ApiEcosystemCollateralStats;
	fpsInfo: ApiEcosystemFpsInfo;
	frankencoinInfo: ApiEcosystemFrankencoinInfo;
	frankencoinMinters: ApiMinterListing;
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
	payload: ApiEcosystemFpsInfo;
};

export type DispatchApiEcosystemFrankencoinInfo = {
	type: string;
	payload: ApiEcosystemFrankencoinInfo;
};

export type DispatchApiEcosystemFrankencoinMinters = {
	type: string;
	payload: ApiMinterListing;
};
