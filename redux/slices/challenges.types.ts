import {
	ApiChallengesChallengers,
	ApiChallengesListing,
	ApiChallengesMapping,
	ApiChallengesPositions,
	ApiChallengesPrices,
} from "@deuro/api";

// --------------------------------------------------------------------------------
export type ChallengesState = {
	error: string | null;
	loaded: boolean;

	list: ApiChallengesListing;
	mapping: ApiChallengesMapping;
	challengers: ApiChallengesChallengers;
	positions: ApiChallengesPositions;
	challengesPrices: ApiChallengesPrices;
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};

export type DispatchApiChallengesListing = {
	type: string;
	payload: ApiChallengesListing;
};

export type DispatchApiChallengesMapping = {
	type: string;
	payload: ApiChallengesMapping;
};

export type DispatchApiChallengesChallengers = {
	type: string;
	payload: ApiChallengesChallengers;
};

export type DispatchApiChallengesPositions = {
	type: string;
	payload: ApiChallengesPositions;
};

export type DispatchApiChallengesPrices = {
	type: string;
	payload: ApiChallengesPrices;
};
