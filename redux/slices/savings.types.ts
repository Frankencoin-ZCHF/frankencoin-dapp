import {
	ApiLeadrateInfo,
	ApiLeadrateProposed,
	ApiLeadrateRate,
	ApiSavingsActivity,
	ApiSavingsBalance,
	ApiSavingsInfo,
	ApiSavingsRanked,
} from "@frankencoin/api";

// --------------------------------------------------------------------------------
export type SavingsState = {
	error: string | null;

	leadrateLoaded: boolean;
	leadrateInfo: ApiLeadrateInfo;
	leadrateRate: ApiLeadrateRate;
	leadrateProposed: ApiLeadrateProposed;

	savingsLoaded: boolean;
	savingsInfo: ApiSavingsInfo;
	savingsBalance: ApiSavingsBalance;
	savingsRanked: ApiSavingsRanked;
	savingsActivity: ApiSavingsActivity;
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};

export type DispatchApiLeadrateInfo = {
	type: string;
	payload: ApiLeadrateInfo;
};

export type DispatchApiLeadrateRate = {
	type: string;
	payload: ApiLeadrateRate;
};

export type DispatchApiLeadrateProposed = {
	type: string;
	payload: ApiLeadrateProposed;
};

export type DispatchApiSavingsInfo = {
	type: string;
	payload: ApiSavingsInfo;
};

export type DispatchApiSavingsBalance = {
	type: string;
	payload: ApiSavingsBalance;
};

export type DispatchApiSavingsRanked = {
	type: string;
	payload: ApiSavingsRanked;
};

export type DispatchApiSavingsActivity = {
	type: string;
	payload: ApiSavingsActivity;
};
