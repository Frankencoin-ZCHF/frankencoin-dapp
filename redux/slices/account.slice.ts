import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { AccountState, DispatchBoolean } from "./account.types";
import { Address } from "viem";

// --------------------------------------------------------------------------------

export const initialState: AccountState = {
	error: null,
	loading: false,
};

// --------------------------------------------------------------------------------

export const slice = createSlice({
	name: "account",
	initialState,
	reducers: {
		// RESET
		resetAccountState(state) {
			state = initialState;
		},

		// HAS ERROR
		hasError(state, action: { payload: string }) {
			state.error = action.payload;
		},

		// SET LOADING
		setLoading: (state, action: { payload: boolean }) => {
			state.loading = action.payload;
		},

		// -------------------------------------
		// SET
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchAccount = (address: Address | undefined) => async (dispatch: Dispatch<DispatchBoolean>) => {
	// ---------------------------------------------------------------
	// Log, set loading to true
	console.log("Loading [REDUX]: Account");
	dispatch(slice.actions.setLoading(true));

	// ---------------------------------------------------------------
	// Fetch account data and dispatch

	/*
	- balance of all ERCInfos
	- allowance of all ERCInfos
	- latestUpdate from ponder indexer
	*/

	// ---------------------------------------------------------------
	// Finalizing, loading set to false
	dispatch(slice.actions.setLoading(false));
};
