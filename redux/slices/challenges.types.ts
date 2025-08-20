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

	list?: ApiChallengesListing;
	mapping?: ApiChallengesMapping;
	challengers?: ApiChallengesChallengers;
	positions?: ApiChallengesPositions;
	challengesPrices?: ApiChallengesPrices;
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};

export type DispatchApiChallengesListing = {
	type: string;
	payload: ApiChallengesListing | undefined;
};

export type DispatchApiChallengesMapping = {
	type: string;
	payload: ApiChallengesMapping | undefined;
};

export type DispatchApiChallengesChallengers = {
	type: string;
	payload: ApiChallengesChallengers | undefined;
};

export type DispatchApiChallengesPositions = {
	type: string;
	payload: ApiChallengesPositions | undefined;
};

export type DispatchApiChallengesPrices = {
	type: string;
	payload: ApiChallengesPrices | undefined;
};
