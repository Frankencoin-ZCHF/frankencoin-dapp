import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { DEURO_API_CLIENT } from "../../app.config";
import {
	DispatchApiEcosystemCollateralPositions,
	DispatchApiEcosystemCollateralStats,
	DispatchApiEcosystemNativePoolShareInfo,
	DispatchApiEcosystemStablecoinInfo,
	DispatchApiEcosystemStablecoinMinters,
	DispatchBoolean,
	EcosystemState,
} from "./ecosystem.types";
import {
	ApiEcosystemCollateralPositions,
	ApiEcosystemCollateralStats,
	ApiEcosystemDepsInfo,
	ApiEcosystemStablecoinInfo,
	ApiMinterListing,
} from "@deuro/api";
import { zeroAddress } from "viem";
import { logApiError } from "../../utils/errorLogger";

// --------------------------------------------------------------------------------

export const initialState: EcosystemState = {
	error: null,
	loaded: false,

	collateralPositions: undefined,
	collateralStats: undefined,
	depsInfo: undefined,
	stablecoinInfo: undefined,
	stablecoinMinters: undefined,
};

// --------------------------------------------------------------------------------

export const slice = createSlice({
	name: "ecosystem",
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
		// SET Collateral Positions
		setCollateralPositions: (state, action: { payload: ApiEcosystemCollateralPositions | undefined }) => {
			state.collateralPositions = action.payload;
		},

		// SET Collateral Stats
		setCollateralStats: (state, action: { payload: ApiEcosystemCollateralStats | undefined }) => {
			state.collateralStats = action.payload;
		},

		// SET Deps Info
		setDepsInfo: (state, action: { payload: ApiEcosystemDepsInfo | undefined }) => {
			state.depsInfo = action.payload;
		},

		// SET Product token Info
		setStablecoinInfo: (state, action: { payload: ApiEcosystemStablecoinInfo | undefined }) => {
			state.stablecoinInfo = action.payload;
		},

		// SET Product token Minters
		setStablecoinMinters: (state, action: { payload: ApiMinterListing | undefined }) => {
			state.stablecoinMinters = action.payload;
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchEcosystem =
	() =>
	async (
		dispatch: Dispatch<
			| DispatchBoolean
			| DispatchApiEcosystemCollateralPositions
			| DispatchApiEcosystemCollateralStats
			| DispatchApiEcosystemNativePoolShareInfo
			| DispatchApiEcosystemStablecoinInfo
			| DispatchApiEcosystemStablecoinMinters
		>
	) => {
		// ---------------------------------------------------------------
		console.log("Loading [REDUX]: Ecosystem");

		try {
			// ---------------------------------------------------------------
			// Query raw data from backend api
			const response1 = await DEURO_API_CLIENT.get("/ecosystem/collateral/positions");
			dispatch(slice.actions.setCollateralPositions(response1.data as ApiEcosystemCollateralPositions));

			const response2 = await DEURO_API_CLIENT.get("/ecosystem/collateral/stats");
			dispatch(slice.actions.setCollateralStats(response2.data as ApiEcosystemCollateralStats));

			const response3 = await DEURO_API_CLIENT.get("/ecosystem/deps/info");
			dispatch(slice.actions.setDepsInfo(response3.data as ApiEcosystemDepsInfo));

			const response4 = await DEURO_API_CLIENT.get("/ecosystem/stablecoin/info");
			dispatch(slice.actions.setStablecoinInfo(response4.data as ApiEcosystemStablecoinInfo));
			
			const response5 = await DEURO_API_CLIENT.get("/ecosystem/stablecoin/minter/list");
			dispatch(slice.actions.setStablecoinMinters(response5.data as ApiMinterListing));

			// ---------------------------------------------------------------
			// Finalizing, loaded set to ture
			dispatch(slice.actions.setLoaded(true));
		} catch (error) {
			logApiError(error, "ecosystem data");
			dispatch(slice.actions.setCollateralPositions(undefined));
			dispatch(slice.actions.setCollateralStats(undefined));
			dispatch(slice.actions.setDepsInfo(undefined));
			dispatch(slice.actions.setStablecoinInfo(undefined));
			dispatch(slice.actions.setStablecoinMinters(undefined));
			dispatch(slice.actions.setLoaded(true));
		}
	};
