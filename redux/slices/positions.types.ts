import { OwnersPositionsQueryObject, PositionQuery, PositionsQueryObject, PositionsQueryObjectArray } from "@frankencoin/api";
import { Address } from "viem";

// --------------------------------------------------------------------------------
export type PositionsState = {
	error: string | null;
	loaded: boolean;

	list: PositionsQueryObject;
	ownersPositions: OwnersPositionsQueryObject;

	openPositions: PositionQuery[];
	closedPositions: PositionQuery[];
	deniedPositioins: PositionQuery[];
	originalPositions: PositionQuery[];
	openPositionsByOriginal: PositionQuery[][];
	openPositionsByCollateral: PositionQuery[][];
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
