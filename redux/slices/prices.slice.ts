import { createSlice, Dispatch } from "@reduxjs/toolkit";
import {
	DispatchBoolean,
	DispatchPriceQueryObjectArray,
	PriceQueryCurrencies,
	PriceQueryObjectArray,
	PriceQuery,
	PricesState,
} from "./prices.types";
import { RootState } from "../redux.store";
import { ERC20Info } from "./positions.types";
import { Address } from "viem";
import { URI_APP_SELECTED } from "../../app.config";

// --------------------------------------------------------------------------------

export const initialState: PricesState = {
	error: null,
	loading: false,

	coingecko: {},
};

// --------------------------------------------------------------------------------

export const slice = createSlice({
	name: "prices",
	initialState,
	reducers: {
		// HAS ERROR
		hasError(state, action: { payload: string }) {
			state.error = action.payload;
		},

		// SET LOADING
		setLoading: (state, action: { payload: boolean }) => {
			state.loading = action.payload;
		},

		// -------------------------------------
		// SET COINGECKO PRICE LIST
		setList: (state, action: { payload: { [key: Address]: PriceQuery } }) => {
			state.coingecko = { ...state.coingecko, ...action.payload };
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchPricesList = (state: RootState) => async (dispatch: Dispatch<DispatchBoolean | DispatchPriceQueryObjectArray>) => {
	const { mintERC20Infos, collateralERC20Infos } = state.positions;
	const infos: ERC20Info[] = mintERC20Infos.concat(...collateralERC20Infos);
	if (infos.length == 0) return;

	// ---------------------------------------------------------------
	// Log, set loading to true
	console.log("Loading [REDUX]: PricesList");
	dispatch(slice.actions.setLoading(true));

	// ---------------------------------------------------------------
	// Query from /api/details
	const response = await fetch(`${URI_APP_SELECTED}/api/prices`);
	const prices = ((await response.json())?.prices as PriceQueryObjectArray) || [];

	if (Object.keys(prices).length == 0) return;
	dispatch(slice.actions.setList(prices));

	// ---------------------------------------------------------------
	// Finalizing, loading set to false
	dispatch(slice.actions.setLoading(false));
};
