import { PositionQuery, ApiPositionsListing, ApiPositionsOwners, ApiPositionsMapping } from "@deuro/api";
import { Address } from "viem";

// --------------------------------------------------------------------------------
export type PositionsState = {
	error: string | null;
	loaded: boolean;

	list?: ApiPositionsListing;
	mapping?: ApiPositionsMapping;
	requests?: ApiPositionsMapping;
	owners?: ApiPositionsOwners;

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

export type DispatchApiPositionsOwners = {
	type: string;
	payload: ApiPositionsOwners | undefined;
};

export type DispatchApiPositionsListing = {
	type: string;
	payload: ApiPositionsListing | undefined;
};

export type DispatchApiPositionsMapping = {
	type: string;
	payload: ApiPositionsMapping | undefined;
};

export type DispatchPositionQueryArray = {
	type: string;
	payload: PositionQuery[];
};

export type DispatchPositionQueryArray2 = {
	type: string;
	payload: PositionQuery[][];
};
