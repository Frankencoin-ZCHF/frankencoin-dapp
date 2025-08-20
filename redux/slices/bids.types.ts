import { ApiBidsBidders, ApiBidsChallenges, ApiBidsListing, ApiBidsMapping, ApiBidsPositions } from "@deuro/api";

// --------------------------------------------------------------------------------
export type BidsState = {
	error: string | null;
	loaded: boolean;

	list?: ApiBidsListing;
	mapping?: ApiBidsMapping;
	bidders?: ApiBidsBidders;
	challenges?: ApiBidsChallenges;
	positions?: ApiBidsPositions;
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};

export type DispatchApiBidsListing = {
	type: string;
	payload: ApiBidsListing | undefined;
};

export type DispatchApiBidsMapping = {
	type: string;
	payload: ApiBidsMapping | undefined;
};

export type DispatchApiBidsBidders = {
	type: string;
	payload: ApiBidsBidders | undefined;
};

export type DispatchApiBidsChallenges = {
	type: string;
	payload: ApiBidsChallenges | undefined;
};

export type DispatchApiBidsPositions = {
	type: string;
	payload: ApiBidsPositions | undefined;
};
