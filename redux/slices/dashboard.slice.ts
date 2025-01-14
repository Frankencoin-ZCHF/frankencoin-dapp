import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { Address } from "viem";
import { DashboardState, DispatchApiDailyLog, DispatchBoolean } from "./dashboard.types";
import { CONFIG, FRANKENCOIN_API_CLIENT } from "../../app.config";
import { ApiDailyLog } from "@frankencoin/api";

// --------------------------------------------------------------------------------

export const initialState: DashboardState = {
	error: null,
	loaded: false,
	dailyLog: { num: 0, logs: [] },
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
		// SET DAILY LOG
		setDailyLog: (state, action: { payload: ApiDailyLog }) => {
			state.dailyLog = action.payload;
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchDashboard = () => async (dispatch: Dispatch<DispatchBoolean | DispatchApiDailyLog>) => {
	// ---------------------------------------------------------------
	CONFIG.verbose && console.log("Loading [REDUX]: Dashboard");

	// ---------------------------------------------------------------
	// Query raw data from backend api;
	const response1 = await FRANKENCOIN_API_CLIENT.get("/analytics/dailyLog/json");
	dispatch(slice.actions.setDailyLog(response1.data as ApiDailyLog));

	// ---------------------------------------------------------------
	// Finalizing, loaded set to true
	dispatch(slice.actions.setLoaded(true));
};
