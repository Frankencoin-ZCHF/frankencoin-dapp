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
} from "./savings.types";
import { ApiLeadrateInfo, ApiLeadrateProposed, ApiLeadrateRate, ApiSavingsInfo, ApiSavingsUserTable } from "@deuro/api";
import { Address, zeroAddress } from "viem";

// --------------------------------------------------------------------------------

export const initialState: SavingsState = {
	error: null,
	loaded: false,

	leadrateInfo: {
		isProposal: false,
		isPending: false,
		nextchange: 0,
		nextRate: 0,
		rate: 0,
	},
	leadrateProposed: {
		blockheight: 0,
		created: 0,
		nextchange: 0,
		nextRate: 0,
		num: 0,
		list: [],
	},
	leadrateRate: {
		blockheight: 0,
		created: 0,
		rate: 0,
		num: 0,
		list: [],
	},

	savingsInfo: {
		totalSaved: 0,
		totalWithdrawn: 0,
		totalBalance: 0,
		totalInterest: 0,
		rate: 0,
		ratioOfSupply: 0,
	},

	savingsUserTable: {
		interest: [],
		save: [],
		withdraw: [],
	},

	savingsAllUserTable: {
		interest: [],
		save: [],
		withdraw: [],
	},
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

		setLeadrateInfo: (state, action: { payload: ApiLeadrateInfo }) => {
			state.leadrateInfo = action.payload;
		},
		setLeadrateProposed: (state, action: { payload: ApiLeadrateProposed }) => {
			state.leadrateProposed = action.payload;
		},
		setLeadrateRate: (state, action: { payload: ApiLeadrateRate }) => {
			state.leadrateRate = action.payload;
		},

		setSavingsInfo: (state, action: { payload: ApiSavingsInfo }) => {
			state.savingsInfo = action.payload;
		},

		setSavingsUserTable: (state, action: { payload: ApiSavingsUserTable }) => {
			state.savingsUserTable = action.payload;
		},

		setSavingsAllUserTable: (state, action: { payload: ApiSavingsUserTable }) => {
			state.savingsAllUserTable = action.payload;
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
		>
	) => {
		// ---------------------------------------------------------------
		console.log("Loading [REDUX]: Savings");

		// ---------------------------------------------------------------
		// Query raw data from backend api
		const response1 = await DEURO_API_CLIENT.get("/savings/leadrate/info");
		dispatch(slice.actions.setLeadrateInfo(response1.data as ApiLeadrateInfo));

		const response2 = await DEURO_API_CLIENT.get("/savings/leadrate/proposals");
		dispatch(slice.actions.setLeadrateProposed(response2.data as ApiLeadrateProposed));

		const response3 = await DEURO_API_CLIENT.get("/savings/leadrate/rates");
		dispatch(slice.actions.setLeadrateRate(response3.data as ApiLeadrateRate));

		/* TODO: Reactivate when API is ready
		const response4 = await DEURO_API_CLIENT.get("/savings/core/info");
		dispatch(slice.actions.setSavingsInfo(response4.data as ApiSavingsInfo));
		*/

		const response6 = await DEURO_API_CLIENT.get(`/savings/core/user/${zeroAddress}`);
		dispatch(slice.actions.setSavingsAllUserTable(response6.data as ApiSavingsUserTable));

		if (account == undefined) {
			dispatch(slice.actions.setSavingsUserTable(initialState.savingsUserTable));
		} else {
			const response5 = await DEURO_API_CLIENT.get(`/savings/core/user/${account}`);
			dispatch(slice.actions.setSavingsUserTable(response5.data as ApiSavingsUserTable));
		}

		// ---------------------------------------------------------------
		// Finalizing, loaded set to ture
		dispatch(slice.actions.setLoaded(true));
	};

// TODO: Deactivate when API is ready, and add this call to fetchSavings
export const fetchSavingsCoreInfo = () => async (dispatch: Dispatch<DispatchApiSavingsInfo>) => {
	const response = await DEURO_API_CLIENT.get("/savings/core/info");
	dispatch(slice.actions.setSavingsInfo(response.data as ApiSavingsInfo));
};
