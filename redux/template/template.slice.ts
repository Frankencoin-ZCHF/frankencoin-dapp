import { createSlice, Dispatch } from '@reduxjs/toolkit';
import client from '../../utils/apollo-client';
import { gql } from '@apollo/client';
import { PricesState } from './template.types';

// --------------------------------------------------------------------------------

export const initialState: PricesState = {
	error: null,
	loading: false,
};

// --------------------------------------------------------------------------------

export const slice = createSlice({
	name: 'prices',
	initialState,
	reducers: {
		// HAS ERROR
		hasError(state, action: { payload: string }) {
			state.error = action.payload;
		},

		// SET LOADING
		setLoading: (state, action: { payload: boolean }) => {
			state.loading = action.payload;
		},

		// -------------------------------------
		// SET
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchPricesList = () => async (dispatch: Dispatch<any>) => {
	// ---------------------------------------------------------------
	// Log, set loading to true
	console.log('Loading [REDUX]: PricesList');
	dispatch(slice.actions.setLoading(true));

	// ---------------------------------------------------------------
	// Finalizing, loading set to false
	dispatch(slice.actions.setLoading(false));
};
