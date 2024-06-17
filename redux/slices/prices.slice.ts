import { createSlice, Dispatch } from "@reduxjs/toolkit";
import {
	DispatchBoolean,
	DispatchERC20InfoObjectArray,
	DispatchPriceQueryObjectArray,
	ERC20Info,
	PriceQuery,
	PricesState,
} from "./prices.types";
import { RootState } from "../redux.store";
import { Address } from "viem";
import { API_URI_SELECTED } from "../../app.config";

// --------------------------------------------------------------------------------

export const initialState: PricesState = {
	error: null,
	loaded: false,

	coingecko: {},
	mint: {
		address: "0x0000000000000000000000000000000000000000",
		name: "Frankencoin",
		symbol: "ZCHF",
		decimals: 18,
	},
	collateral: {},
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

		// SET LOADED
		setLoaded: (state, action: { payload: boolean }) => {
			state.loaded = action.payload;
		},

		// -------------------------------------
		// SET COINGECKO PRICE LIST
		setList: (state, action: { payload: { [key: Address]: PriceQuery } }) => {
			state.coingecko = { ...state.coingecko, ...action.payload };
		},

		// -------------------------------------
		// SET MINT ERC20Info
		setMintERC20Info: (state, action: { payload: ERC20Info }) => {
			state.mint = action.payload;
		},

		// SET COLLATERAL ERC20Info
		setCollateralERC20Info: (state, action: { payload: { [key: Address]: ERC20Info } }) => {
			state.collateral = action.payload;
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchPricesList =
	() => async (dispatch: Dispatch<DispatchBoolean | DispatchPriceQueryObjectArray | DispatchERC20InfoObjectArray>) => {
		// ---------------------------------------------------------------
		console.log("Loading [REDUX]: PricesList");

		// ---------------------------------------------------------------
		// Query raw data from backend api
		const response1 = await fetch(`${API_URI_SELECTED}/prices/list`);
		const list = (await response1.json()) as { [key: Address]: PriceQuery };
		dispatch(slice.actions.setList(list));

		const response2 = await fetch(`${API_URI_SELECTED}/prices/mint`);
		const mint = (await response2.json()) as ERC20Info;
		dispatch(slice.actions.setMintERC20Info(mint));

		const response3 = await fetch(`${API_URI_SELECTED}/prices/collateral`);
		const collateral = (await response3.json()) as { [key: Address]: ERC20Info };
		dispatch(slice.actions.setCollateralERC20Info(collateral));

		// ---------------------------------------------------------------
		// Finalizing, loaded set to ture
		dispatch(slice.actions.setLoaded(true));
	};
