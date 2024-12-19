import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { PricesState, DispatchBoolean, DispatchApiPriceMapping, DispatchApiPriceERC20Mapping } from "./prices.types";
import { ApiPriceERC20, ApiPriceERC20Mapping, ApiPriceMapping } from "@deuro/api";
import { DEURO_API_CLIENT } from "../../app.config";
import { zeroAddress } from "viem";

// --------------------------------------------------------------------------------

export const initialState: PricesState = {
	error: null,
	loaded: false,

	coingecko: {},
	mint: {
		address: zeroAddress,
		name: "Frankencoin",
		symbol: "ZCHF",
		decimals: 18,
	},
	fps: {
		address: zeroAddress,
		name: "Frankencoin Pool Share",
		symbol: "FPS",
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
		setListMapping: (state, action: { payload: ApiPriceMapping }) => {
			state.coingecko = { ...state.coingecko, ...action.payload };
		},

		// -------------------------------------
		// SET MINT ERC20Info
		setMintERC20Info: (state, action: { payload: ApiPriceERC20 }) => {
			state.mint = action.payload;
		},

		// -------------------------------------
		// SET FPS ERC20Info
		setFpsERC20Info: (state, action: { payload: ApiPriceERC20 }) => {
			state.fps = action.payload;
		},

		// SET COLLATERAL ERC20Info
		setCollateralERC20Info: (state, action: { payload: ApiPriceERC20Mapping }) => {
			state.collateral = action.payload;
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchPricesList =
	() => async (dispatch: Dispatch<DispatchBoolean | DispatchApiPriceMapping | DispatchApiPriceERC20Mapping>) => {
		// ---------------------------------------------------------------
		console.log("Loading [REDUX]: PricesList");

		// ---------------------------------------------------------------
		// Query raw data from backend api
		const response1 = await DEURO_API_CLIENT.get("/prices/mapping");
		dispatch(slice.actions.setListMapping(response1.data as ApiPriceMapping));

		const response2 = await DEURO_API_CLIENT.get("/prices/erc20/mint");
		dispatch(slice.actions.setMintERC20Info(response2.data as ApiPriceERC20));

		const response3 = await DEURO_API_CLIENT.get("/prices/erc20/collateral");
		dispatch(slice.actions.setCollateralERC20Info(response3.data as ApiPriceERC20Mapping));

		const response4 = await DEURO_API_CLIENT.get("/prices/erc20/deps");
		dispatch(slice.actions.setFpsERC20Info(response4.data as ApiPriceERC20));

		// ---------------------------------------------------------------
		// Finalizing, loaded set to ture
		dispatch(slice.actions.setLoaded(true));
	};
