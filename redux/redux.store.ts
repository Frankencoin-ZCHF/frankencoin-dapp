import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";

// splices
import { reducer as accountReducer } from "./slices/account.slice";
import { reducer as dashboardReducer } from "./slices/dashboard.slice";
import { reducer as ecosystemReducer } from "./slices/ecosystem.slice";
import { reducer as positionReducer } from "./slices/positions.slice";
import { reducer as pricesReducer } from "./slices/prices.slice";
import { reducer as challengesReducer } from "./slices/challenges.slice";
import { reducer as bidsReducer } from "./slices/bids.slice";
import { reducer as savingsReducer } from "./slices/savings.slice";
import { reducer as morphoReducer } from "./slices/morpho.slice";

// store with combined reducers
export const store = configureStore({
	reducer: combineReducers({
		account: accountReducer,
		dashboard: dashboardReducer,
		ecosystem: ecosystemReducer,
		positions: positionReducer,
		prices: pricesReducer,
		challenges: challengesReducer,
		bids: bidsReducer,
		savings: savingsReducer,
		morpho: morphoReducer,
	}),
});

// types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
