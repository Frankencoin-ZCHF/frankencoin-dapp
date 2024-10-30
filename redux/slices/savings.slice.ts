import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { FRANKENCOIN_API_CLIENT } from "../../app.config";
import {
	DispatchApiLeadrateInfo,
	DispatchApiLeadrateProposed,
	DispatchApiLeadrateRate,
	DispatchBoolean,
	SavingsState,
} from "./savings.types";
import { ApiLeadrateInfo, ApiLeadrateProposed, ApiLeadrateRate } from "@frankencoin/api";

// --------------------------------------------------------------------------------

export const initialState: SavingsState = {
	error: null,
	loaded: false,

	leadrateInfo: {
		isProposal: false,
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
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchSavings =
	() => async (dispatch: Dispatch<DispatchBoolean | DispatchApiLeadrateInfo | DispatchApiLeadrateProposed | DispatchApiLeadrateRate>) => {
		// ---------------------------------------------------------------
		console.log("Loading [REDUX]: Savings");

		// ---------------------------------------------------------------
		// Query raw data from backend api
		const response1 = await FRANKENCOIN_API_CLIENT.get("/savings/leadrate/info");
		dispatch(slice.actions.setLeadrateInfo(response1.data as ApiLeadrateInfo));

		const response2 = await FRANKENCOIN_API_CLIENT.get("/savings/leadrate/proposals");
		dispatch(slice.actions.setLeadrateProposed(response2.data as ApiLeadrateProposed));

		const response3 = await FRANKENCOIN_API_CLIENT.get("/savings/leadrate/rates");
		dispatch(slice.actions.setLeadrateRate(response3.data as ApiLeadrateRate));

		// ---------------------------------------------------------------
		// Finalizing, loaded set to ture
		dispatch(slice.actions.setLoaded(true));
	};