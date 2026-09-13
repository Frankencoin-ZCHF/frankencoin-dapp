import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { ApiAmplifierListing } from "@frankencoin/api";
import { FRANKENCOIN_API_CLIENT } from "../../app.config";
import { showErrorToast } from "@utils";
import { AmplifiersState } from "./amplifiers.types";

export const initialState: AmplifiersState = {
	error: null,
	loaded: false,
	list: [],
};

export const slice = createSlice({
	name: "amplifiers",
	initialState,
	reducers: {
		hasError(state, action: { payload: string }) {
			state.error = action.payload;
		},
		setLoaded(state, action: { payload: boolean }) {
			state.loaded = action.payload;
		},
		setList(state, action: { payload: AmplifiersState["list"] }) {
			state.list = action.payload;
		},
	},
});

export const { reducer } = slice;

/**
 * Loads all production amplifiers with their borrowed amount and the live valuation of the
 * Uniswap liquidity backing it. The API only lists amplifiers that already have positions,
 * so a deployed but unused amplifier is legitimately absent.
 */
export const fetchAmplifierList = () => async (dispatch: Dispatch) => {
	try {
		const response = await FRANKENCOIN_API_CLIENT.get<ApiAmplifierListing>("/amplifier/list");
		dispatch(slice.actions.setList(response.data.list ?? []));
		dispatch(slice.actions.setLoaded(true));
	} catch (error) {
		showErrorToast({ message: "Fetching Amplifiers", error });
		dispatch(slice.actions.hasError(String(error)));
	}
};
