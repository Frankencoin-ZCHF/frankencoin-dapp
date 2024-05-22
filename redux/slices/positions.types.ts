import { Address } from 'viem';

// --------------------------------------------------------------------------------
export type PositionsState = {
	error: string | null;
	loading: boolean;
	list: PositionQuery[];

	openPositions: PositionQuery[];
	closedPositions: PositionQuery[];
	deniedPositioins: PositionQuery[];
	originalPositions: PositionQuery[];
	openPositionsByOriginal: PositionQuery[][];
	openPositionsByCollateral: PositionQuery[][];

	collateralAddresses: Address[];
	collateralERC20Infos: ERC20Info[];
	mintERC20Infos: ERC20Info[];
};

// --------------------------------------------------------------------------------
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
	start: string;
	expiration: string;
	challengePeriod: string;

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

export type ERC20Info = {
	address: Address;
	name: string;
	symbol: string;
	decimals: number;
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

export type DispatchPositionQueryArray = {
	type: string;
	payload: PositionQuery[];
};

export type DispatchPositionQueryArray2 = {
	type: string;
	payload: PositionQuery[][];
};

export type DispatchERC20InfoArray = {
	type: string;
	payload: ERC20Info[];
};
