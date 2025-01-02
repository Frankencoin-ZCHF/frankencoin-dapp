import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { GlobalPreferencesState, DispatchWithoutPayload } from "./globalPreferences.types";

// --------------------------------------------------------------------------------

export const initialState: GlobalPreferencesState = {
	expertMode: typeof window !== 'undefined' ? localStorage.getItem("expertMode") == "true" : false,
};

// --------------------------------------------------------------------------------

export const slice = createSlice({
	name: "globalPreferences",
	initialState,
	reducers: {
		toggleExpertMode(state) {
			const newMode = !state.expertMode;
			state.expertMode = newMode;
			if (typeof window !== 'undefined') {
				localStorage.setItem("expertMode", newMode ? "true" : "false");
			}
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

export const toggleExpertMode = () => async (dispatch: Dispatch<DispatchWithoutPayload>) => {
	dispatch(actions.toggleExpertMode());
};
