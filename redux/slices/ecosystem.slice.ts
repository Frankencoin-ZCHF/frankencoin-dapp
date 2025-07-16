import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { CONFIG, FRANKENCOIN_API_CLIENT, FRANKENCOIN_API_CLIENT_TEST } from "../../app.config";
import {
	DispatchApiEcosystemCollateralPositions,
	DispatchApiEcosystemCollateralStats,
	DispatchApiEcosystemFpsInfo,
	DispatchApiEcosystemFrankencoinInfo,
	DispatchApiEcosystemFrankencoinMinters,
	DispatchBoolean,
	EcosystemState,
} from "./ecosystem.types";
import {
	ApiEcosystemCollateralPositions,
	ApiEcosystemCollateralStats,
	ApiEcosystemFpsInfo,
	ApiEcosystemFrankencoinInfo,
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
		>
	) => {
		// ---------------------------------------------------------------
		CONFIG.verbose && console.log("Loading [REDUX]: Ecosystem");

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

		const response5 = await FRANKENCOIN_API_CLIENT_TEST.get("/ecosystem/minter/list"); // FIXME: Change back to production api
		dispatch(slice.actions.setFrankencoinMinters(response5.data as ApiMinterListing));

		// ---------------------------------------------------------------
		// Finalizing, loaded set to ture
		dispatch(slice.actions.setLoaded(true));
	};
