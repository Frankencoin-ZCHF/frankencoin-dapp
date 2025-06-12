import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { DispatchBoolean, DispatchMarketArray, Market, MorphoState } from "./morpho.types";
import { CONFIG, MORPHOGRAPH_CLIENT, WAGMI_CHAIN } from "../../app.config";
import { gql } from "@apollo/client";
import { ADDRESS } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

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

	const fetcher = async (loanAssetAddress_in: string) => {
		const { data } = await MORPHOGRAPH_CLIENT.query<{
			markets: {
				items: Market[];
			};
		}>({
			query: gql`
				query {
					markets ( where: { loanAssetAddress_in: ["${loanAssetAddress_in}"] }) {
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
		return data.markets.items;
	};

	try {
		const frankencoin = ADDRESS[mainnet.id].frankencoin;
		const whiteListingMarketIds: string[] = [
			"0xe3a65a68d203a3e3cbd4a59e4604db431439ee6eeb3f88268d7f57e415df7e94",
			"0x091756a1ba71f388fd5a959150c255acc55ce1e3714010a069ecb96f51b74235",
			"0x554a7c19653b5b58b9e7e8349ae89f50f36298e02b44fb196816fc018fea4031",
			"0x1b1ee1ee5370849479edc8af35ba966353c030c7837de172d45f1e1689756a18",
		];
		const fetchedMarkets: Market[] = await fetcher(frankencoin);
		const filteredMarkets: Market[] = fetchedMarkets.filter((m) => {
			return m.collateralAsset != null && m.state.liquidityAssets != "0" && whiteListingMarketIds.includes(m.uniqueKey);
		});

		dispatch(slice.actions.setMarkets(filteredMarkets));
	} catch (error) {
		console.error(error);
	}

	// ---------------------------------------------------------------
	// Finalizing, loading set to false
	dispatch(slice.actions.setLoading(false));
};
