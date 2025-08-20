import { ApiLeadrateInfo, ApiLeadrateProposed, ApiLeadrateRate, ApiSavingsInfo, ApiSavingsUserTable, ApiSavingsUserLeaderboard } from "@deuro/api";

// --------------------------------------------------------------------------------
export type SavingsState = {
	error: string | null;
	loaded: boolean;

	leadrateInfo: ApiLeadrateInfo | undefined;
	leadrateProposed: ApiLeadrateProposed | undefined;
	leadrateRate: ApiLeadrateRate | undefined;

	savingsInfo: ApiSavingsInfo | undefined;

	savingsUserTable: ApiSavingsUserTable | undefined;
	savingsAllUserTable: ApiSavingsUserTable | undefined;
	savingsLeaderboard: ApiSavingsUserLeaderboard[] | undefined;
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};

export type DispatchApiLeadrateInfo = {
	type: string;
	payload: ApiLeadrateInfo | undefined;
};

export type DispatchApiLeadrateProposed = {
	type: string;
	payload: ApiLeadrateProposed | undefined;
};

export type DispatchApiLeadrateRate = {
	type: string;
	payload: ApiLeadrateRate | undefined;
};

export type DispatchApiSavingsInfo = {
	type: string;
	payload: ApiSavingsInfo | undefined;
};

export type DispatchApiSavingsUserTable = {
	type: string;
	payload: ApiSavingsUserTable | undefined;
};

export type DispatchApiSavingsLeaderboard = {
	type: string;
	payload: ApiSavingsUserLeaderboard[] | undefined;
};
