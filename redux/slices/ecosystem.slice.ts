import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { CONFIG, FRANKENCOIN_API_CLIENT } from "../../app.config";
import { showErrorToast } from "@utils";
import {
	DispatchApiEcosystemCollateralPositions,
	DispatchApiEcosystemCollateralStats,
	DispatchApiEcosystemFpsInfo,
	DispatchApiEcosystemFrankencoinInfo,
	DispatchApiEcosystemFrankencoinMinters,
	DispatchApiEcosystemFrankencoinSupply,
	DispatchBoolean,
	EcosystemState,
} from "./ecosystem.types";
import {
	ApiEcosystemCollateralPositions,
	ApiEcosystemCollateralStats,
	ApiEcosystemFpsInfo,
	ApiEcosystemFrankencoinInfo,
	ApiEcosystemFrankencoinSupply,
	ApiMinterListing,
} from "@frankencoin/api";

// --------------------------------------------------------------------------------

export const initialState: EcosystemState = {
	error: null,
	loaded: false,

	collateralPositions: {},
	collateralStats: { num: 0, addresses: [], totalValueLocked: { usd: 0, chf: 0 }, map: {} },
	fpsInfo: {
		erc20: { decimals: 0, name: "", symbol: "" },
		chains: {} as ApiEcosystemFpsInfo["chains"],
		reserve: { balance: 0, equity: 0, minter: 0 },
		token: { marketCap: 0, price: 0, totalSupply: 0 },
		earnings: { profit: 0, loss: 0 },
	},
	frankencoinInfo: {
		erc20: { decimals: 0, name: "", symbol: "" },
		chains: {} as ApiEcosystemFrankencoinInfo["chains"],
		token: { supply: 0, usd: 0 },
		fps: {
			price: 0,
			totalSupply: 0,
			marketCap: 0,
		},
		tvl: { usd: 0, chf: 0 },
	},
	frankencoinMinters: { num: 0, list: [] },
	frankencoinSupply: {} as ApiEcosystemFrankencoinSupply,
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
		setCollateralPositions: (state, action: { payload: ApiEcosystemCollateralPositions }) => {
			state.collateralPositions = action.payload;
		},

		// SET Collateral Stats
		setCollateralStats: (state, action: { payload: ApiEcosystemCollateralStats }) => {
			state.collateralStats = action.payload;
		},

		// SET Fps Info
		setFpsInfo: (state, action: { payload: ApiEcosystemFpsInfo }) => {
			state.fpsInfo = action.payload;
		},

		// SET Frankencoin Info
		setFrankencoinInfo: (state, action: { payload: ApiEcosystemFrankencoinInfo }) => {
			state.frankencoinInfo = action.payload;
		},

		// SET Frankencoin Minters
		setFrankencoinMinters: (state, action: { payload: ApiMinterListing }) => {
			state.frankencoinMinters = action.payload;
		},

		// SET Frankencoin Supply
		setFrankencoinSupply: (state, action: { payload: ApiEcosystemFrankencoinSupply }) => {
			state.frankencoinSupply = action.payload;
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
			| DispatchApiEcosystemFpsInfo
			| DispatchApiEcosystemFrankencoinInfo
			| DispatchApiEcosystemFrankencoinMinters
			| DispatchApiEcosystemFrankencoinSupply
		>
	) => {
		// ---------------------------------------------------------------
		CONFIG.verbose && console.log("Loading [REDUX]: Ecosystem");

		try {
			// ---------------------------------------------------------------
			// Query raw data from backend api
			const response1 = await FRANKENCOIN_API_CLIENT.get("/ecosystem/collateral/positions");
			dispatch(slice.actions.setCollateralPositions(response1.data as ApiEcosystemCollateralPositions));

			const response2 = await FRANKENCOIN_API_CLIENT.get("/ecosystem/collateral/stats");
			dispatch(slice.actions.setCollateralStats(response2.data as ApiEcosystemCollateralStats));

			const response3 = await FRANKENCOIN_API_CLIENT.get("/ecosystem/fps/info");
			dispatch(slice.actions.setFpsInfo(response3.data as ApiEcosystemFpsInfo));

			const response4 = await FRANKENCOIN_API_CLIENT.get("/ecosystem/frankencoin/info");
			dispatch(slice.actions.setFrankencoinInfo(response4.data as ApiEcosystemFrankencoinInfo));

			const response5 = await FRANKENCOIN_API_CLIENT.get("/ecosystem/minter/list");
			dispatch(slice.actions.setFrankencoinMinters(response5.data as ApiMinterListing));

			const response6 = await FRANKENCOIN_API_CLIENT.get("/ecosystem/frankencoin/totalsupply");
			dispatch(slice.actions.setFrankencoinSupply(response6.data as ApiEcosystemFrankencoinSupply));

			// ---------------------------------------------------------------
			// Finalizing, loaded set to true
			dispatch(slice.actions.setLoaded(true));
		} catch (error) {
			// ---------------------------------------------------------------
			// Error, show toast message
			showErrorToast({ message: "Fetching Ecosystem", error });
		}
	};
