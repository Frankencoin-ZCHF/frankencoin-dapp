import { PositionQuery, ApiPositionsListing, ApiPositionsOwners, ApiPositionsMapping } from "@deuro/api";
import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { uniqueValues } from "@utils";
import { DEURO_API_CLIENT } from "../../app.config";
import {
	PositionsState,
	DispatchBoolean,
	DispatchPositionQueryArray,
	DispatchPositionQueryArray2,
	DispatchApiPositionsListing,
	DispatchApiPositionsOwners,
	DispatchApiPositionsMapping,
} from "./positions.types";
import { logApiError } from "../../utils/errorLogger";


const WFP_POSITION_ORIGINAL = "0xca428F192c20a48b23be1408c6fF12212746D866";

const patchWFPPositions = (position: PositionQuery) => {
	if(position.original.toLowerCase() === WFP_POSITION_ORIGINAL.toLowerCase()) {
		return { ...position, minimumCollateral: BigInt(4e18).toString() };
	}
	return position;
};

// --------------------------------------------------------------------------------

export const initialState: PositionsState = {
	error: null,
	loaded: false,

	list: undefined,
	mapping: undefined,
	requests: undefined,
	owners: undefined,

	openPositions: [],
	closedPositions: [],
	deniedPositioins: [],
	originalPositions: [],
	openPositionsByOriginal: [],
	openPositionsByCollateral: [],
};

// --------------------------------------------------------------------------------

export const slice = createSlice({
	name: "positions",
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
		setList: (state, action: { payload: ApiPositionsListing | undefined }) => {
			state.list = action.payload;
		},

		// -------------------------------------
		// SET LIST Mapping
		setListMapping: (state, action: { payload: ApiPositionsMapping | undefined }) => {
			state.mapping = action.payload;
		},

		// -------------------------------------
		// SET REQUESTS LIST
		setRequestsList: (state, action: { payload: ApiPositionsMapping | undefined }) => {
			state.requests = action.payload;
		},

		// SET OWNERS POSITIOS
		setOwnersPositions: (state, action: { payload: ApiPositionsOwners | undefined }) => {
			state.owners = action.payload;
		},

		// -------------------------------------
		// SET OPEN POSITIONS
		setOpenPositions: (state, action: { payload: PositionQuery[] }) => {
			state.openPositions = action.payload;
		},

		// SET CLOSED POSITIONS
		setClosedPositions: (state, action: { payload: PositionQuery[] }) => {
			state.closedPositions = action.payload;
		},

		// SET DENIED POSITIONS
		setDeniedPositions: (state, action: { payload: PositionQuery[] }) => {
			state.deniedPositioins = action.payload;
		},

		// SET ORIGINAL POSITIONS
		setOriginalPositions: (state, action: { payload: PositionQuery[] }) => {
			state.originalPositions = action.payload;
		},

		// SET OPEN POSITIONS BY ORIGINAL
		setOpenPositionsByOriginal: (state, action: { payload: PositionQuery[][] }) => {
			state.openPositionsByOriginal = action.payload;
		},

		// SET OPEN POSITIONS BY COLLATERAL
		setOpenPositionsByCollateral: (state, action: { payload: PositionQuery[][] }) => {
			state.openPositionsByCollateral = action.payload;
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchPositionsList =
	() =>
	async (
		dispatch: Dispatch<
			| DispatchBoolean
			| DispatchApiPositionsListing
			| DispatchApiPositionsMapping
			| DispatchApiPositionsOwners
			| DispatchPositionQueryArray
			| DispatchPositionQueryArray2
		>
	) => {
		// ---------------------------------------------------------------
		console.log("Loading [REDUX]: PositionsList");

		try {
			// ---------------------------------------------------------------
			// Query raw data from backend api;
			const response1 = await DEURO_API_CLIENT.get("/positions/list");
			const listArray = response1.data.list.map(patchWFPPositions) as PositionQuery[];
			dispatch(slice.actions.setList({ ...response1.data, list: listArray }));

			const responseMapping = await DEURO_API_CLIENT.get("/positions/mapping");
			const positionsMapping = responseMapping.data as ApiPositionsMapping;
			const patchedMapping = Object.fromEntries(Object.entries(positionsMapping.map).map(([key, position]) => [key, patchWFPPositions(position)]));
			dispatch(slice.actions.setListMapping({ ...positionsMapping, map: patchedMapping }));

			const response2 = await DEURO_API_CLIENT.get("/positions/owners");
			const positionsByOwners = response2.data as ApiPositionsOwners;
			const patchedOwners = Object.fromEntries(Object.entries(positionsByOwners.map).map(([key, positionArray]) => [key, positionArray.map(patchWFPPositions)]));
			dispatch(slice.actions.setOwnersPositions({ ...positionsByOwners, map: patchedOwners }));

			const response3 = await DEURO_API_CLIENT.get("/positions/requests");
			const positionsRequests = response3.data as ApiPositionsMapping;
			const patchedRequests = Object.fromEntries(Object.entries(positionsRequests.map).map(([key, position]) => [key, patchWFPPositions(position)]));
			dispatch(slice.actions.setRequestsList({ ...positionsRequests, map: patchedRequests }));

			// ---------------------------------------------------------------
			// filter positions and dispatch
			const openPositions = listArray.filter((position) => !position.denied && !position.closed);
			const collateralAddresses = openPositions.map((position) => position.collateral).filter(uniqueValues);

			// const requestedPositions = collateralAddresses.map((con) => listArray.filter((position) => position.collateral == con));
			const closedPositioins = listArray.filter((position) => position.closed);
			const deniedPositioins = listArray.filter((position) => position.denied);
			const originalPositions = openPositions.filter((position) => position.isOriginal);
			const openPositionsByOriginal = originalPositions.map((o) => openPositions.filter((p) => p.original == o.original));
			const openPositionsByCollateral = collateralAddresses.map((con) => openPositions.filter((position) => position.collateral == con));

			dispatch(slice.actions.setOpenPositions(openPositions));
			dispatch(slice.actions.setClosedPositions(closedPositioins));
			dispatch(slice.actions.setDeniedPositions(deniedPositioins));
			dispatch(slice.actions.setOriginalPositions(originalPositions));
			dispatch(slice.actions.setOpenPositionsByOriginal(openPositionsByOriginal));
			dispatch(slice.actions.setOpenPositionsByCollateral(openPositionsByCollateral));
		} catch (error) {
			logApiError(error, "positions data");
			dispatch(slice.actions.setList(undefined));
			dispatch(slice.actions.setListMapping(undefined));
			dispatch(slice.actions.setOwnersPositions(undefined));
			dispatch(slice.actions.setRequestsList(undefined));
			dispatch(slice.actions.setOpenPositions([]));
			dispatch(slice.actions.setClosedPositions([]));
			dispatch(slice.actions.setDeniedPositions([]));
			dispatch(slice.actions.setOriginalPositions([]));
			dispatch(slice.actions.setOpenPositionsByOriginal([]));
			dispatch(slice.actions.setOpenPositionsByCollateral([]));
		}

		// ---------------------------------------------------------------
		// Finalizing, loaded set to true
		dispatch(slice.actions.setLoaded(true));
	};
