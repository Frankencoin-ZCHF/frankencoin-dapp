import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { FRANKENCOIN_API_CLIENT } from "../../app.config";
import { showErrorToast } from "@utils";
import { ApiCCIPChain, ApiCCIPProposal, BridgeState } from "./bridge.types";

export const initialState: BridgeState = {
	error: null,
	loaded: false,
	proposals: [],
	chains: [],
};

export const slice = createSlice({
	name: "bridge",
	initialState,
	reducers: {
		hasError(state, action: { payload: string }) {
			state.error = action.payload;
		},
		setLoaded(state, action: { payload: boolean }) {
			state.loaded = action.payload;
		},
		setProposals(state, action: { payload: ApiCCIPProposal[] }) {
			state.proposals = action.payload;
		},
		setChains(state, action: { payload: ApiCCIPChain[] }) {
			state.chains = action.payload;
		},
	},
});

export const { reducer } = slice;

export const fetchBridge = () => async (dispatch: Dispatch) => {
	try {
		const [proposalsRes, chainsRes] = await Promise.all([
			FRANKENCOIN_API_CLIENT.get<{ list: ApiCCIPProposal[] }>("/bridge/proposals"),
			FRANKENCOIN_API_CLIENT.get<{ list: ApiCCIPChain[] }>("/bridge/chains"),
		]);
		dispatch(slice.actions.setProposals(proposalsRes.data.list));
		dispatch(slice.actions.setChains(chainsRes.data.list));
		dispatch(slice.actions.setLoaded(true));
	} catch (error) {
		showErrorToast({ message: "Fetching Bridge", error });
		dispatch(slice.actions.hasError(String(error)));
	}
};
