import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { DEURO_API_CLIENT } from "../../app.config";
import {
	BidsState,
	DispatchBoolean,
	DispatchApiBidsListing,
	DispatchApiBidsBidders,
	DispatchApiBidsChallenges,
	DispatchApiBidsPositions,
	DispatchApiBidsMapping,
} from "./bids.types";
import { ApiBidsBidders, ApiBidsChallenges, ApiBidsListing, ApiBidsMapping, ApiBidsPositions } from "@deuro/api";

// --------------------------------------------------------------------------------

export const initialState: BidsState = {
	error: null,
	loaded: false,

	list: { num: 0, list: [] },

	mapping: { num: 0, bidIds: [], map: {} },
	bidders: { num: 0, bidders: [], map: {} },
	challenges: { num: 0, challenges: [], map: {} },
	positions: { num: 0, positions: [], map: {} },
};

// --------------------------------------------------------------------------------

export const slice = createSlice({
	name: "bids",
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
		// SET Bids LIST
		setList: (state, action: { payload: ApiBidsListing }) => {
			state.list = action.payload;
		},

		// -------------------------------------
		// SET Bids mapping
		setMapping: (state, action: { payload: ApiBidsMapping }) => {
			state.mapping = action.payload;
		},

		// -------------------------------------
		// SET Bids Bidders
		setBidders: (state, action: { payload: ApiBidsBidders }) => {
			state.bidders = action.payload;
		},

		// -------------------------------------
		// SET Bids Challenges
		setChallenges: (state, action: { payload: ApiBidsChallenges }) => {
			state.challenges = action.payload;
		},

		// -------------------------------------
		// SET Bids Positions
		setPositions: (state, action: { payload: ApiBidsPositions }) => {
			state.positions = action.payload;
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchBidsList =
	() =>
	async (
		dispatch: Dispatch<
			| DispatchBoolean
			| DispatchApiBidsListing
			| DispatchApiBidsMapping
			| DispatchApiBidsBidders
			| DispatchApiBidsChallenges
			| DispatchApiBidsPositions
		>
	) => {
		// ---------------------------------------------------------------
		console.log("Loading [REDUX]: BidsList");

		// ---------------------------------------------------------------
		// Query raw data from backend api
		const response1 = await DEURO_API_CLIENT.get("/challenges/bids/list");
		dispatch(slice.actions.setList(response1.data as ApiBidsListing));

		const responseMapping = await DEURO_API_CLIENT.get("/challenges/bids/mapping");
		dispatch(slice.actions.setMapping(responseMapping.data as ApiBidsMapping));

		const response2 = await DEURO_API_CLIENT.get("/challenges/bids/bidders");
		dispatch(slice.actions.setBidders(response2.data as ApiBidsBidders));

		const response3 = await DEURO_API_CLIENT.get("/challenges/bids/challenges");
		dispatch(slice.actions.setChallenges(response3.data as ApiBidsChallenges));

		const response4 = await DEURO_API_CLIENT.get("/challenges/bids/positions");
		dispatch(slice.actions.setPositions(response4.data as ApiBidsPositions));

		// ---------------------------------------------------------------
		// Finalizing, loaded set to ture
		dispatch(slice.actions.setLoaded(true));
	};
