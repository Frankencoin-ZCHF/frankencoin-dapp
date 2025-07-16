import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { CONFIG, FRANKENCOIN_API_CLIENT, FRANKENCOIN_API_CLIENT_TEST } from "../../app.config";
import {
	DispatchApiLeadrateInfo,
	DispatchApiLeadrateProposed,
	DispatchApiLeadrateRate,
	DispatchApiSavingsActivity,
	DispatchApiSavingsBalance,
	DispatchApiSavingsInfo,
	DispatchApiSavingsRanked,
	DispatchBoolean,
	SavingsState,
} from "./savings.types";
import {
	ApiLeadrateInfo,
	ApiLeadrateRate,
	ApiLeadrateProposed,
	ApiSavingsBalance,
	ApiSavingsInfo,
	ApiSavingsRanked,
	ApiSavingsActivity,
} from "@frankencoin/api";
import { Address, zeroAddress } from "viem";

// --------------------------------------------------------------------------------

export const initialState: SavingsState = {
	error: null,

	leadrateLoaded: false,
	leadrateInfo: {
		rate: {} as ApiLeadrateInfo["rate"],
		proposed: {} as ApiLeadrateInfo["proposed"],
		open: {} as ApiLeadrateInfo["open"],
	},
	leadrateRate: {
		rate: {} as ApiLeadrateRate["rate"],
		list: {} as ApiLeadrateRate["list"],
	},
	leadrateProposed: {
		proposed: {} as ApiLeadrateProposed["proposed"],
		list: {} as ApiLeadrateProposed["list"],
	},

	savingsLoaded: false,
	savingsInfo: {
		status: {} as ApiSavingsInfo["status"],
		totalBalance: {} as ApiSavingsInfo["totalBalance"],
		ratioOfSupply: 0,
	},
	savingsBalance: {} as ApiSavingsBalance,
	savingsRanked: {} as ApiSavingsRanked,
	savingsActivity: [],
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
		setLeadrateLoaded: (state, action: { payload: boolean }) => {
			state.leadrateLoaded = action.payload;
		},
		setLeadrateInfo: (state, action: { payload: ApiLeadrateInfo }) => {
			state.leadrateInfo = action.payload;
		},
		setLeadrateProposed: (state, action: { payload: ApiLeadrateProposed }) => {
			state.leadrateProposed = action.payload;
		},
		setLeadrateRate: (state, action: { payload: ApiLeadrateRate }) => {
			state.leadrateRate = action.payload;
		},

		setSavingsLoaded: (state, action: { payload: boolean }) => {
			state.savingsLoaded = action.payload;
		},
		setSavingsInfo: (state, action: { payload: ApiSavingsInfo }) => {
			state.savingsInfo = action.payload;
		},
		setSavingsBalance: (state, action: { payload: ApiSavingsBalance }) => {
			state.savingsBalance = action.payload;
		},
		setSavingsRanked: (state, action: { payload: ApiSavingsRanked }) => {
			state.savingsRanked = action.payload;
		},
		setSavingsActivity: (state, action: { payload: ApiSavingsActivity }) => {
			state.savingsActivity = action.payload;
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchLeadrate =
	() => async (dispatch: Dispatch<DispatchBoolean | DispatchApiLeadrateInfo | DispatchApiLeadrateProposed | DispatchApiLeadrateRate>) => {
		// ---------------------------------------------------------------
		CONFIG.verbose && console.log("Loading [REDUX]: Leadrate");

		// ---------------------------------------------------------------
		// Query raw data from backend api
		// FIXME: replace FRANKENCOIN_API_CLIENT_TEST with FRANKENCOIN_API_CLIENT
		const response1 = await FRANKENCOIN_API_CLIENT_TEST.get<ApiLeadrateInfo>("/savings/leadrate/info");
		dispatch(slice.actions.setLeadrateInfo(response1.data));

		const response2 = await FRANKENCOIN_API_CLIENT_TEST.get<ApiLeadrateProposed>("/savings/leadrate/proposals");
		dispatch(slice.actions.setLeadrateProposed(response2.data));

		const response3 = await FRANKENCOIN_API_CLIENT_TEST.get<ApiLeadrateRate>("/savings/leadrate/rates");
		dispatch(slice.actions.setLeadrateRate(response3.data));

		// ---------------------------------------------------------------
		// Finalizing, loaded set to ture
		dispatch(slice.actions.setLeadrateLoaded(true));
	};

// --------------------------------------------------------------------------------
export const fetchSavings =
	(account: Address | undefined) =>
	async (
		dispatch: Dispatch<
			DispatchBoolean | DispatchApiSavingsInfo | DispatchApiSavingsBalance | DispatchApiSavingsRanked | DispatchApiSavingsActivity
		>
	) => {
		// ---------------------------------------------------------------
		CONFIG.verbose && console.log("Loading [REDUX]: Savings");

		// ---------------------------------------------------------------
		// Query raw data from backend api
		const response4 = await FRANKENCOIN_API_CLIENT_TEST.get<ApiSavingsInfo>("/savings/core/info");
		dispatch(slice.actions.setSavingsInfo(response4.data));

		const response5 = await FRANKENCOIN_API_CLIENT_TEST.get<ApiSavingsBalance>(
			"/savings/core/balance" + (account ? `/${account}` : "")
		);
		dispatch(slice.actions.setSavingsBalance(response5.data));

		const response6 = await FRANKENCOIN_API_CLIENT_TEST.get<ApiSavingsActivity>(
			"/savings/core/activity" + (account ? `/${account}` : "")
		);
		dispatch(slice.actions.setSavingsActivity(response6.data));

		const response7 = await FRANKENCOIN_API_CLIENT_TEST.get<ApiSavingsRanked>("/savings/core/ranked");
		dispatch(slice.actions.setSavingsRanked(response7.data));

		// ---------------------------------------------------------------
		// Finalizing, loaded set to ture
		dispatch(slice.actions.setSavingsLoaded(true));
	};
