import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { DispatchBoolean, DispatchMarketArray, Market, MorphoState } from "./morpho.types";
import { CONFIG, MORPHOGRAPH_CLIENT } from "../../app.config";
import { gql } from "@apollo/client";

// --------------------------------------------------------------------------------

export const initialState: MorphoState = {
	error: null,
	loading: false,

	markets: [],
};

// --------------------------------------------------------------------------------

export const slice = createSlice({
	name: "morpho",
	initialState,
	reducers: {
		// RESET
		resetState(state) {
			state = initialState;
		},

		// HAS ERROR
		hasError(state, action: { payload: string }) {
			state.error = action.payload;
		},

		// SET LOADING
		setLoading: (state, action: { payload: boolean }) => {
			state.loading = action.payload;
		},

		// -------------------------------------
		// SET MARKETS
		setMarkets: (state, action: { payload: Market[] }) => {
			state.markets = action.payload;
		},
	},
});

export const reducer = slice.reducer;
export const actions = slice.actions;

// --------------------------------------------------------------------------------
export const fetchMorphoMarkets = () => async (dispatch: Dispatch<DispatchBoolean | DispatchMarketArray>) => {
	// ---------------------------------------------------------------
	// Log, set loading to true
	CONFIG.verbose && console.log("Loading [REDUX]: Morpho Markets");
	dispatch(slice.actions.setLoading(true));

	// ---------------------------------------------------------------
	// Fetch data and dispatch

	const fetcher = async (uniqueKey_in: string) => {
		const { data } = await MORPHOGRAPH_CLIENT.query<{
			markets: {
				items: Market[];
			};
		}>({
			query: gql`
				query {
					markets(where: { uniqueKey_in: "${uniqueKey_in}" }) {
						items {
							uniqueKey
							lltv
							oracleAddress
							irmAddress
							loanAsset {
								address
								symbol
								name
								decimals
							}
							collateralAsset {
								address
								symbol
								name
								decimals
							}
							state {
								borrowApy
								borrowAssets
								borrowAssetsUsd
								supplyApy
								supplyAssets
								supplyAssetsUsd
								fee
								utilization
								timestamp
								liquidityAssets
								liquidityAssetsUsd
								price
								monthlyBorrowApy
								monthlySupplyApy
								quarterlyBorrowApy
								quarterlySupplyApy
							}
						}
					}
				}
			`,
		});
		return data.markets.items.length > 0 ? data.markets.items[0] : null;
	};

	try {
		const fetchedMarkets: (Market | null)[] = [];
		fetchedMarkets.push(await fetcher("0xe3a65a68d203a3e3cbd4a59e4604db431439ee6eeb3f88268d7f57e415df7e94"));
		fetchedMarkets.push(await fetcher("0x091756a1ba71f388fd5a959150c255acc55ce1e3714010a069ecb96f51b74235"));

		dispatch(slice.actions.setMarkets(fetchedMarkets.filter((m) => m != null)));
	} catch (error) {
		console.error(error);
	}

	// ---------------------------------------------------------------
	// Finalizing, loading set to false
	dispatch(slice.actions.setLoading(false));
};
