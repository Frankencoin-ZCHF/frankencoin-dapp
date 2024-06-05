import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { Address } from "viem";
import { DashboardState, DispatchBoolean } from "./dashboard.types";

// --------------------------------------------------------------------------------

export const initialState: DashboardState = {
	error: null,
	loaded: false,
	tabs: {
		positionsTab: "observatory",
		positionTab: "create",
	},
};

// --------------------------------------------------------------------------------

export const slice = createSlice({
	name: "dashboard",
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

		// -------------------------------------
		// SET
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchDashboard = (address: Address) => async (dispatch: Dispatch<DispatchBoolean>) => {
	// ---------------------------------------------------------------
	console.log("Loading [REDUX]: Dashboard");

	// ---------------------------------------------------------------
	// Finalizing, loaded set to true
	dispatch(slice.actions.setLoaded(true));
};
