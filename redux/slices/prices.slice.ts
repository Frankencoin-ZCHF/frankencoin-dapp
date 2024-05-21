import { createSlice, Dispatch } from '@reduxjs/toolkit';
import axios from 'axios';
import {
	DispatchBoolean,
	DispatchPriceQueryObjectArray,
	PriceQueryCurrencies,
	PriceQueryObjectArray,
	PriceQuery,
	PricesState,
} from './prices.types';
import { RootState } from '../redux.store';
import { ERC20Info } from './positions.types';
import { Address } from 'viem';

// --------------------------------------------------------------------------------

export const initialState: PricesState = {
	error: null,
	loading: false,

	coingecko: {},
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
		// SET COINGECKO PRICE LIST
		setList: (state, action: { payload: { [key: Address]: PriceQuery } }) => {
			state.coingecko = { ...state.coingecko, ...action.payload };
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchPricesList = (state: RootState) => async (dispatch: Dispatch<DispatchBoolean | DispatchPriceQueryObjectArray>) => {
	const { mintERC20Infos, collateralERC20Infos } = state.positions;
	const infos: ERC20Info[] = mintERC20Infos.concat(...collateralERC20Infos);
	if (infos.length == 0) return;

	// ---------------------------------------------------------------
	// Log, set loading to true
	console.log('Loading [REDUX]: PricesList');
	dispatch(slice.actions.setLoading(true));

	// ---------------------------------------------------------------
	// Query raw data from coingecko
	// TODO: dynamic loading of multiple sources and multile contracts
	// FIXME: coingecko contract limit: 1 for free plan
	const fetchAddresses: Address[] = infos.map((i) => i.address);
	const fetchSourcesCoingecko = async function (contracts: Address[]) {
		const url = (addr: Address) =>
			`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addr}&vs_currencies=usd`;
		return contracts.map(async (c) => await axios.get(url(c)));
	};

	// fetch from coingecko
	const data = await Promise.allSettled(await fetchSourcesCoingecko(fetchAddresses));
	const prices: { [key: Address]: PriceQuery } = {};

	for (let p of data) {
		if (p.status == 'rejected') continue;
		if (p.value.status != 200) continue;

		const contract: Address = Object.keys(p.value.data).at(0) as Address;
		if (!contract) continue;

		const price: PriceQueryCurrencies = contract ? p.value.data[contract] : null;
		if (!price) continue;

		const erc = infos.find((i) => i.address.toLowerCase() == contract);
		if (!erc) continue;

		const timestamp = Date.now();

		prices[contract] = {
			...erc,
			timestamp,
			price,
		};
	}

	dispatch(slice.actions.setList(prices));

	// ---------------------------------------------------------------
	// Finalizing, loading set to false
	dispatch(slice.actions.setLoading(false));
};
