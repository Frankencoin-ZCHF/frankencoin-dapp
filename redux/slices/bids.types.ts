import { ApiBidsBidders, ApiBidsChallenges, ApiBidsListing, ApiBidsMapping, ApiBidsPositions } from "@deuro/api";

// --------------------------------------------------------------------------------
export type BidsState = {
	error: string | null;
	loaded: boolean;

	list: ApiBidsListing;

	mapping: ApiBidsMapping;
	bidders: ApiBidsBidders;
	challenges: ApiBidsChallenges;
	positions: ApiBidsPositions;
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};

export type DispatchApiBidsListing = {
	type: string;
	payload: ApiBidsListing;
};

export type DispatchApiBidsMapping = {
	type: string;
	payload: ApiBidsMapping;
};

export type DispatchApiBidsBidders = {
	type: string;
	payload: ApiBidsBidders;
};

export type DispatchApiBidsChallenges = {
	type: string;
	payload: ApiBidsChallenges;
};

export type DispatchApiBidsPositions = {
	type: string;
	payload: ApiBidsPositions;
};
