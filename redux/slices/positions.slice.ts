import { OwnersPositionsQueryObject, PositionQuery, PositionsQueryObject } from "@frankencoin/api";
import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { uniqueValues } from "@utils";
import { API_URI_SELECTED } from "../../app.config";
import {
	PositionsState,
	DispatchBoolean,
	DispatchPositionQueryArray,
	DispatchPositionQueryArray2,
	DispatchPositionsQueryObjectArray,
	DispatchOwnersPositionsQueryObject,
} from "./positions.types";

// --------------------------------------------------------------------------------

export const initialState: PositionsState = {
	error: null,
	loaded: false,

	list: { num: 0, positions: {} },
	ownersPositions: { num: 0, owners: [], positions: {} },

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
		setList: (state, action: { payload: PositionsQueryObject }) => {
			state.list = action.payload;
		},

		// SET OWNERS POSITIOS
		setOwnersPositions: (state, action: { payload: OwnersPositionsQueryObject }) => {
			state.ownersPositions = action.payload;
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
			| DispatchPositionsQueryObjectArray
			| DispatchOwnersPositionsQueryObject
			| DispatchPositionQueryArray
			| DispatchPositionQueryArray2
		>
	) => {
		// ---------------------------------------------------------------
		console.log("Loading [REDUX]: PositionsList");

		// ---------------------------------------------------------------
		// Query raw data from backend api
		const response1 = await fetch(`${API_URI_SELECTED}/positions/list`);
		const list = (await response1.json()) as PositionsQueryObject;
		dispatch(slice.actions.setList(list));

		const response2 = await fetch(`${API_URI_SELECTED}/positions/owners`);
		const owners = (await response2.json()) as OwnersPositionsQueryObject;
		dispatch(slice.actions.setOwnersPositions(owners));

		// const response3 = await fetch(`${API_URI_SELECTED}/positions/requests`);
		// const requests = (await response2.json()) as OwnersPositionsQueryObject;
		// dispatch(slice.actions.setOwnersPositions(owners));

		// ---------------------------------------------------------------
		// filter positions and dispatch
		const listArray = Object.values(list.positions);
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

		// ---------------------------------------------------------------
		// Finalizing, loaded set to true
		dispatch(slice.actions.setLoaded(true));
	};
