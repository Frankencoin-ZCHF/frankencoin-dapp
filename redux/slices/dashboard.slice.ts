import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { Address } from "viem";
import { DashboardState, DispatchApiDailyLog, DispatchApiTransactionLog, DispatchBoolean } from "./dashboard.types";
import { CONFIG, FRANKENCOIN_API_CLIENT } from "../../app.config";
import { ApiDailyLog, ApiTransactionLog } from "@frankencoin/api";
import { showErrorToast } from "@utils";

// --------------------------------------------------------------------------------

export const initialState: DashboardState = {
	error: null,
	loaded: false,
	dailyLog: { num: 0, logs: [] },
	txLog: {
		num: 0,
		logs: [],
		pageInfo: {
			startCursor: "",
			endCursor: "",
			hasNextPage: false,
		},
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
		// SET DAILY LOG
		setDailyLog: (state, action: { payload: ApiDailyLog }) => {
			state.dailyLog = action.payload;
		},

		// -------------------------------------
		// SET TX LOG
		setTxLog: (state, action: { payload: ApiTransactionLog }) => {
			state.txLog = action.payload;
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchDashboard = () => async (dispatch: Dispatch<DispatchBoolean | DispatchApiDailyLog>) => {
	// ---------------------------------------------------------------
	CONFIG.verbose && console.log("Loading [REDUX]: Dashboard");

	try {
		// ---------------------------------------------------------------
		// Query raw data from backend api;
		const response1 = await FRANKENCOIN_API_CLIENT.get("/analytics/dailyLog/json");
		dispatch(slice.actions.setDailyLog(response1.data as ApiDailyLog));

		// ---------------------------------------------------------------
		// Finalizing, loaded set to true
		dispatch(slice.actions.setLoaded(true));
	} catch (error) {
		// ---------------------------------------------------------------
		// Error, show toast message
		showErrorToast({ message: "Fetching DailyLog", error });
	}
};

// --------------------------------------------------------------------------------
export const fetchTransactionLogs = () => async (dispatch: Dispatch<DispatchApiTransactionLog>) => {
	// ---------------------------------------------------------------
	CONFIG.verbose && console.log("Loading [REDUX]: Dashboard/TransactionLog");

	try {
		// ---------------------------------------------------------------
		// Query raw data from backend api;
		const response1 = await FRANKENCOIN_API_CLIENT.get("/analytics/transactionLog/json?limit=200");
		dispatch(slice.actions.setTxLog(response1.data as ApiTransactionLog));
	} catch (error) {
		// ---------------------------------------------------------------
		// Error, show toast message
		showErrorToast({ message: "Fetching TransactionLog", error });
	}
};
