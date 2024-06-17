import { Address } from "viem";

// --------------------------------------------------------------------------------
export type PositionsState = {
	error: string | null;
	loaded: boolean;

	list: PositionsQueryObjectArray;
	ownersPositions: OwnersPositionsQueryObject;

	openPositions: PositionQuery[];
	closedPositions: PositionQuery[];
	deniedPositioins: PositionQuery[];
	originalPositions: PositionQuery[];
	openPositionsByOriginal: PositionQuery[][];
	openPositionsByCollateral: PositionQuery[][];
};

// --------------------------------------------------------------------------------
export type OwnersPositionsQueryObject = {
	num: number;
	owners: Address[];
	positions: OwnersPositionsObjectArray;
};

export type OwnersPositionsObjectArray = {
	[key: Address]: PositionQuery[];
};

export type PositionsQueryObjectArray = {
	[key: Address]: PositionQuery;
};

export type PositionQuery = {
	position: Address;
	owner: Address;
	zchf: Address;
	collateral: Address;
	price: string;

	created: number;
	isOriginal: boolean;
	isClone: boolean;
	denied: boolean;
	closed: boolean;
	original: Address;

	minimumCollateral: string;
	annualInterestPPM: number;
	reserveContribution: number;
	start: number;
	cooldown: number;
	expiration: number;
	challengePeriod: number;

	zchfName: string;
	zchfSymbol: string;
	zchfDecimals: number;

	collateralName: string;
	collateralSymbol: string;
	collateralDecimals: number;
	collateralBalance: string;

	limitForPosition: string;
	limitForClones: string;
	availableForPosition: string;
	availableForClones: string;
	minted: string;
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};

export type DispatchAddressArray = {
	type: string;
	payload: Address[];
};

export type DispatchOwnersPositionsQueryObject = {
	type: string;
	payload: OwnersPositionsQueryObject;
};

export type DispatchPositionsQueryObjectArray = {
	type: string;
	payload: PositionsQueryObjectArray;
};

export type DispatchPositionQueryArray = {
	type: string;
	payload: PositionQuery[];
};

export type DispatchPositionQueryArray2 = {
	type: string;
	payload: PositionQuery[][];
};
