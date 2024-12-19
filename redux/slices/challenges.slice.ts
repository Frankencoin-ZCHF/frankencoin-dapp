import { createSlice, Dispatch } from "@reduxjs/toolkit";
import {
	ApiChallengesChallengers,
	ApiChallengesListing,
	ApiChallengesMapping,
	ApiChallengesPositions,
	ApiChallengesPrices,
} from "@deuro/api";
import { DEURO_API_CLIENT } from "../../app.config";
import {
	ChallengesState,
	DispatchApiChallengesChallengers,
	DispatchApiChallengesListing,
	DispatchApiChallengesMapping,
	DispatchApiChallengesPositions,
	DispatchApiChallengesPrices,
	DispatchBoolean,
} from "./challenges.types";

// --------------------------------------------------------------------------------

export const initialState: ChallengesState = {
	error: null,
	loaded: false,

	list: { num: 0, list: [] },

	mapping: { num: 0, challenges: [], map: {} },
	challengers: { num: 0, challengers: [], map: {} },
	positions: { num: 0, positions: [], map: {} },
	challengesPrices: { num: 0, ids: [], map: {} },
};

// --------------------------------------------------------------------------------

export const slice = createSlice({
	name: "challenges",
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
		// SET LIST
		setList: (state, action: { payload: ApiChallengesListing }) => {
			state.list = action.payload;
		},

		// -------------------------------------
		// SET MAPPING
		setMapping: (state, action: { payload: ApiChallengesMapping }) => {
			state.mapping = action.payload;
		},

		// -------------------------------------
		// SET Challengers
		setChallengers: (state, action: { payload: ApiChallengesChallengers }) => {
			state.challengers = action.payload;
		},

		// SET Positions
		setPositions: (state, action: { payload: ApiChallengesPositions }) => {
			state.positions = action.payload;
		},

		// SET Prices
		setPrices: (state, action: { payload: ApiChallengesPrices }) => {
			state.challengesPrices = action.payload;
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchChallengesList =
	() =>
	async (
		dispatch: Dispatch<
			| DispatchBoolean
			| DispatchApiChallengesListing
			| DispatchApiChallengesMapping
			| DispatchApiChallengesChallengers
			| DispatchApiChallengesPositions
			| DispatchApiChallengesPrices
		>
	) => {
		// ---------------------------------------------------------------
		console.log("Loading [REDUX]: ChallengesList");

		// ---------------------------------------------------------------
		// Query raw data from backend api
		const response1 = await DEURO_API_CLIENT.get("/challenges/list");
		dispatch(slice.actions.setList(response1.data as ApiChallengesListing));

		const responseMapping = await DEURO_API_CLIENT.get("/challenges/mapping");
		dispatch(slice.actions.setMapping(responseMapping.data as ApiChallengesMapping));

		const response2 = await DEURO_API_CLIENT.get("/challenges/challengers");
		dispatch(slice.actions.setChallengers(response2.data as ApiChallengesChallengers));

		const response3 = await DEURO_API_CLIENT.get("/challenges/positions");
		dispatch(slice.actions.setPositions(response3.data as ApiChallengesPositions));

		const response4 = await DEURO_API_CLIENT.get("/challenges/prices");
		dispatch(slice.actions.setPrices(response4.data as ApiChallengesPrices));

		// ---------------------------------------------------------------
		// Finalizing, loaded set to ture
		dispatch(slice.actions.setLoaded(true));
	};
