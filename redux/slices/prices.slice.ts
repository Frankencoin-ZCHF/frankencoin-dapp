import { createSlice, Dispatch } from "@reduxjs/toolkit";
import {
	PricesState,
	DispatchBoolean,
	DispatchApiPriceMapping,
	DispatchApiPriceERC20Mapping,
	DispatchApiPriceMarketChart,
} from "./prices.types";
import { ApiPriceERC20, ApiPriceERC20Mapping, ApiPriceMapping, ApiPriceMarketChart } from "@frankencoin/api";
import { CONFIG, FRANKENCOIN_API_CLIENT } from "../../app.config";
import { showErrorToast } from "@utils";
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
	marketChart: { prices: [], market_caps: [], total_volumes: [] },
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

		// -------------------------------------
		// SET Market Chart
		setMarketChart: (state, action: { payload: ApiPriceMarketChart }) => {
			state.marketChart = action.payload;
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchPricesList =
	() => async (dispatch: Dispatch<DispatchBoolean | DispatchApiPriceMapping | DispatchApiPriceERC20Mapping>) => {
		// ---------------------------------------------------------------
		CONFIG.verbose && console.log("Loading [REDUX]: PricesList");

		try {
			// ---------------------------------------------------------------
			// Query raw data from backend api
			const response1 = await FRANKENCOIN_API_CLIENT.get("/prices/mapping");
			dispatch(slice.actions.setListMapping(response1.data as ApiPriceMapping));

			const response2 = await FRANKENCOIN_API_CLIENT.get("/prices/erc20/mint");
			dispatch(slice.actions.setMintERC20Info(response2.data as ApiPriceERC20));

			const response3 = await FRANKENCOIN_API_CLIENT.get("/prices/erc20/collateral");
			dispatch(slice.actions.setCollateralERC20Info(response3.data as ApiPriceERC20Mapping));

			const response4 = await FRANKENCOIN_API_CLIENT.get("/prices/erc20/fps");
			dispatch(slice.actions.setFpsERC20Info(response4.data as ApiPriceERC20));

			// ---------------------------------------------------------------
			// Finalizing, loaded set to true
			dispatch(slice.actions.setLoaded(true));
		} catch (error) {
			// ---------------------------------------------------------------
			// Error, show toast message
			showErrorToast({ message: "Fetching PricesList", error });
		}
	};

// --------------------------------------------------------------------------------
export const fetchMarketChart = () => async (dispatch: Dispatch<DispatchApiPriceMarketChart>) => {
	// ---------------------------------------------------------------
	CONFIG.verbose && console.log("Loading [REDUX]: MarketChart");

	try {
		// ---------------------------------------------------------------
		// Query raw data from backend api
		const response1 = await FRANKENCOIN_API_CLIENT.get("/prices/marketChart");
		dispatch(slice.actions.setMarketChart(response1.data as ApiPriceMarketChart));
	} catch (error) {
		// ---------------------------------------------------------------
		// Error, show toast message
		showErrorToast({ message: "Fetching MarketChart", error });
	}
};
