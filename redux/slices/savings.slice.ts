import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { DEURO_API_CLIENT } from "../../app.config";
import {
	DispatchApiLeadrateInfo,
	DispatchApiLeadrateProposed,
	DispatchApiLeadrateRate,
	DispatchApiSavingsInfo,
	DispatchApiSavingsUserTable,
	DispatchBoolean,
	SavingsState,
	DispatchApiSavingsLeaderboard,
} from "./savings.types";
import { ApiLeadrateInfo, ApiLeadrateProposed, ApiLeadrateRate, ApiSavingsInfo, ApiSavingsUserTable, ApiSavingsUserLeaderboard } from "@deuro/api";
import { Address, zeroAddress } from "viem";
import { logApiError } from "../../utils/errorLogger";

// --------------------------------------------------------------------------------

export const initialState: SavingsState = {
	error: null,
	loaded: false,

	leadrateInfo: undefined,
	leadrateProposed: undefined,
	leadrateRate: undefined,
	savingsInfo: undefined,
	savingsUserTable: undefined,
	savingsAllUserTable: undefined,
	savingsLeaderboard: undefined,
};

// --------------------------------------------------------------------------------

export const slice = createSlice({
	name: "savings",
	initialState,
	reducers: {
		// HAS ERROR
		hasError(state, action: { payload: string }) {
			state.error = action.payload;
		},

		// SET LOADED
		setLoaded: (state, action: { payload: boolean }) => {
			state.loaded = action.payload;
		},

		setLeadrateInfo: (state, action: { payload: ApiLeadrateInfo | undefined }) => {
			state.leadrateInfo = action.payload;
		},
		setLeadrateProposed: (state, action: { payload: ApiLeadrateProposed | undefined }) => {
			state.leadrateProposed = action.payload;
		},
		setLeadrateRate: (state, action: { payload: ApiLeadrateRate | undefined }) => {
			state.leadrateRate = action.payload;
		},

		setSavingsInfo: (state, action: { payload: ApiSavingsInfo | undefined }) => {
			state.savingsInfo = action.payload;
		},

		setSavingsUserTable: (state, action: { payload: ApiSavingsUserTable | undefined }) => {
			state.savingsUserTable = action.payload;
		},

		setSavingsAllUserTable: (state, action: { payload: ApiSavingsUserTable | undefined }) => {
			state.savingsAllUserTable = action.payload;
		},
		setSavingsLeaderboard: (state, action: { payload: ApiSavingsUserLeaderboard[] | undefined }) => {
			state.savingsLeaderboard = action.payload;
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchSavings =
	(account: Address | undefined) =>
	async (
		dispatch: Dispatch<
			| DispatchBoolean
			| DispatchApiLeadrateInfo
			| DispatchApiLeadrateProposed
			| DispatchApiLeadrateRate
			| DispatchApiSavingsInfo
			| DispatchApiSavingsUserTable
			| DispatchApiSavingsLeaderboard
		>
	) => {
		// ---------------------------------------------------------------
		console.log("Loading [REDUX]: Savings");

		try {
			// ---------------------------------------------------------------
			// Query raw data from backend api
			const response1 = await DEURO_API_CLIENT.get("/savings/leadrate/info");
		dispatch(slice.actions.setLeadrateInfo(response1.data as ApiLeadrateInfo));

		const response2 = await DEURO_API_CLIENT.get("/savings/leadrate/proposals");
		dispatch(slice.actions.setLeadrateProposed(response2.data as ApiLeadrateProposed));

		const response3 = await DEURO_API_CLIENT.get("/savings/leadrate/rates");
		dispatch(slice.actions.setLeadrateRate(response3.data as ApiLeadrateRate));

		const response4 = await DEURO_API_CLIENT.get("/savings/core/info");
		dispatch(slice.actions.setSavingsInfo(response4.data as ApiSavingsInfo));

		const response6 = await DEURO_API_CLIENT.get(`/savings/core/user/${zeroAddress}`);
		dispatch(slice.actions.setSavingsAllUserTable(response6.data as ApiSavingsUserTable));

		if (account == undefined) {
			dispatch(slice.actions.setSavingsUserTable(undefined));
		} else {
			const response5 = await DEURO_API_CLIENT.get(`/savings/core/user/${account}`);
			dispatch(slice.actions.setSavingsUserTable(response5.data as ApiSavingsUserTable));
		}

			const response7 = await DEURO_API_CLIENT.get("/savings/core/info/leaderboard");
			dispatch(slice.actions.setSavingsLeaderboard(response7.data as ApiSavingsUserLeaderboard[]));
		} catch (error) {
			logApiError(error, "savings data");
			dispatch(slice.actions.setLeadrateInfo(undefined));
			dispatch(slice.actions.setLeadrateProposed(undefined));
			dispatch(slice.actions.setLeadrateRate(undefined));
			dispatch(slice.actions.setSavingsInfo(undefined));
			dispatch(slice.actions.setSavingsAllUserTable(undefined));
			dispatch(slice.actions.setSavingsUserTable(undefined));
			dispatch(slice.actions.setSavingsLeaderboard(undefined));
		}

		// ---------------------------------------------------------------
		// Finalizing, loaded set to ture
		dispatch(slice.actions.setLoaded(true));
	};

export const fetchSavingsCoreInfo = () => async (dispatch: Dispatch<DispatchApiSavingsInfo>) => {
	const response = await DEURO_API_CLIENT.get("/savings/core/info");
	dispatch(slice.actions.setSavingsInfo(response.data as ApiSavingsInfo));
};
