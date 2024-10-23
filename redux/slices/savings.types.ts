import { ApiLeadrateInfo, ApiLeadrateProposed, ApiLeadrateRate } from "@frankencoin/api";

// --------------------------------------------------------------------------------
export type SavingsState = {
	error: string | null;
	loaded: boolean;

	leadrateInfo: ApiLeadrateInfo;
	leadrateProposed: ApiLeadrateProposed;
	leadrateRate: ApiLeadrateRate;
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

export type DispatchApiLeadrateProposed = {
	type: string;
	payload: ApiLeadrateProposed;
};

export type DispatchApiLeadrateRate = {
	type: string;
	payload: ApiLeadrateRate;
};
