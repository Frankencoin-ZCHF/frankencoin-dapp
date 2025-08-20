import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { PricesState, DispatchBoolean, DispatchApiPriceMapping, DispatchApiPriceERC20Mapping, DispatchApiPriceERC20, DispatchPriceQueryCurrencies } from "./prices.types";
import { ApiPriceERC20, ApiPriceERC20Mapping, ApiPriceMapping, PriceQueryCurrencies } from "@deuro/api";
import { DEURO_API_CLIENT } from "../../app.config";
import { zeroAddress } from "viem";
import { logApiError } from "../../utils/errorLogger";

// --------------------------------------------------------------------------------

export const initialState: PricesState = {
	error: null,
	loaded: false,

	coingecko: undefined,
	eur: undefined,
	mint: undefined,
	nativePS: undefined,
	collateral: undefined,
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
		setListMapping: (state, action: { payload: ApiPriceMapping | undefined }) => {
			state.coingecko = action.payload;
		},

		// -------------------------------------
		// SET MINT ERC20Info
		setMintERC20Info: (state, action: { payload: ApiPriceERC20 | undefined }) => {
			state.mint = action.payload;
		},

		// -------------------------------------
		// SET Native Pool Share ERC20Info
		setNativePSERC20Info: (state, action: { payload: ApiPriceERC20 | undefined }) => {
			state.nativePS = action.payload;
		},

		// SET COLLATERAL ERC20Info
		setCollateralERC20Info: (state, action: { payload: ApiPriceERC20Mapping | undefined }) => {
			state.collateral = action.payload;
		},

		// SET EUR PRICE
		setEurPrice: (state, action: { payload: PriceQueryCurrencies | undefined }) => {
			state.eur = action.payload;
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchPricesList =
	() => async (dispatch: Dispatch<DispatchBoolean | DispatchApiPriceMapping | DispatchApiPriceERC20Mapping | DispatchApiPriceERC20 | DispatchPriceQueryCurrencies>) => {
		// ---------------------------------------------------------------
		console.log("Loading [REDUX]: PricesList");

		try {
			// ---------------------------------------------------------------
			// Query raw data from backend api
			const response1 = await DEURO_API_CLIENT.get("/prices/mapping");
			dispatch(slice.actions.setListMapping(response1.data as ApiPriceMapping));

			const response2 = await DEURO_API_CLIENT.get("/prices/erc20/mint");
			dispatch(slice.actions.setMintERC20Info(response2.data as ApiPriceERC20));

			const response3 = await DEURO_API_CLIENT.get("/prices/erc20/collateral");
			dispatch(slice.actions.setCollateralERC20Info(response3.data as ApiPriceERC20Mapping));

			const response4 = await DEURO_API_CLIENT.get("/prices/erc20/deps");
			dispatch(slice.actions.setNativePSERC20Info(response4.data as ApiPriceERC20));

			const response5 = await DEURO_API_CLIENT.get("/prices/eur");
			dispatch(slice.actions.setEurPrice(response5.data as PriceQueryCurrencies));
		} catch (error) {
			logApiError(error, "prices data");
			dispatch(slice.actions.setListMapping(undefined));
			dispatch(slice.actions.setMintERC20Info(undefined));
			dispatch(slice.actions.setCollateralERC20Info(undefined));
			dispatch(slice.actions.setNativePSERC20Info(undefined));
			dispatch(slice.actions.setEurPrice(undefined));
		}

		// ---------------------------------------------------------------
		// Finalizing, loaded set to ture
		dispatch(slice.actions.setLoaded(true));
	};
