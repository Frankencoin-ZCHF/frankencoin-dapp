import { useAccount, useBlockNumber } from "wagmi";
import { Address } from "viem";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState, store } from "../redux/redux.store";
import { fetchPositionsList } from "../redux/slices/positions.slice";
import { fetchPricesList } from "../redux/slices/prices.slice";
import { fetchAccount, actions as accountActions } from "../redux/slices/account.slice";
import { useIsConnectedToCorrectChain } from "../hooks/useWalletConnectStats";
import { WAGMI_CHAIN } from "../app.config";
import LoadingScreen from "./LoadingScreen";
import { fetchChallengesList } from "../redux/slices/challenges.slice";
import { fetchBidsList } from "../redux/slices/bids.slice";
import { fetchEcosystem } from "../redux/slices/ecosystem.slice";
import { fetchSavings } from "../redux/slices/savings.slice";

let initializing: boolean = false;
let initStart: number = 0;
let loading: boolean = false;

export default function BockUpdater({ children }: { children?: React.ReactElement | React.ReactElement[] }) {
	const { error, data } = useBlockNumber({ chainId: WAGMI_CHAIN.id, watch: true });
	const { address } = useAccount();
	const isConnectedToCorrectChain = useIsConnectedToCorrectChain();

	const [initialized, setInitialized] = useState<boolean>(false);
	const [latestHeight, setLatestHeight] = useState<number>(0);
	const [latestConnectedToChain, setLatestConnectedToChain] = useState<boolean>(false);
	const [latestAddress, setLatestAddress] = useState<Address | undefined>(undefined);

	const loadedEcosystem: boolean = useSelector((state: RootState) => state.ecosystem.loaded);
	const loadedPositions: boolean = useSelector((state: RootState) => state.positions.loaded);
	const loadedPrices: boolean = useSelector((state: RootState) => state.prices.loaded);
	const loadedChallenges: boolean = useSelector((state: RootState) => state.challenges.loaded);
	const loadedBids: boolean = useSelector((state: RootState) => state.bids.loaded);
	const loadedSavings: boolean = useSelector((state: RootState) => state.savings.loaded);

	// --------------------------------------------------------------------------------
	// Init
	useEffect(() => {
		if (initialized) return;
		if (initializing) return;
		initializing = true;
		initStart = Date.now();

		console.log(`Init [BlockUpdater]: Start loading application data... ${initStart}`);
		store.dispatch(fetchEcosystem());
		store.dispatch(fetchPositionsList());
		store.dispatch(fetchPricesList());
		store.dispatch(fetchChallengesList());
		store.dispatch(fetchBidsList());
		store.dispatch(fetchSavings());
	}, [initialized]);

	// --------------------------------------------------------------------------------
	// Init done
	useEffect(() => {
		if (initialized) return;
		if (loadedEcosystem && loadedPositions && loadedPrices && loadedChallenges && loadedBids && loadedSavings) {
			console.log(`Init [BlockUpdater]: Done. ${Date.now() - initStart} ms`);
			setInitialized(true);
		}
	}, [initialized, loadedPositions, loadedPrices, loadedEcosystem, loadedChallenges, loadedBids, loadedSavings]);

	// --------------------------------------------------------------------------------
	// Bock update policies
	useEffect(() => {
		if (!initialized) return;
		if (loading) return;

		// verify
		if (!data || error) return;
		const fetchedLatestHeight: number = parseInt(data.toString());

		// New block? set new state
		if (fetchedLatestHeight <= latestHeight) return;
		loading = true;
		setLatestHeight(fetchedLatestHeight);

		// Block update policy: EACH BLOCK
		console.log(`Policy [BlockUpdater]: EACH BLOCK ${fetchedLatestHeight}`);
		store.dispatch(fetchPositionsList());
		store.dispatch(fetchChallengesList());
		store.dispatch(fetchBidsList());
		if (latestAddress) store.dispatch(fetchAccount(latestAddress));

		// Block update policy: EACH 10 BLOCKS
		if (fetchedLatestHeight % 5 === 0) {
			console.log(`Policy [BlockUpdater]: EACH 10 BLOCKS ${fetchedLatestHeight}`);
			store.dispatch(fetchEcosystem());
			store.dispatch(fetchPricesList());
			store.dispatch(fetchSavings());
		}

		// Block update policy: EACH 100 BLOCKS
		if (fetchedLatestHeight % 100 === 0) {
			console.log(`Policy [BlockUpdater]: EACH 100 BLOCKS ${fetchedLatestHeight}`);
			// store.dispatch(fetchPricesList());
		}

		// Unlock block updates
		loading = false;
	}, [initialized, error, data, latestHeight, latestAddress]);

	// --------------------------------------------------------------------------------
	// Connected to correct chain changes
	useEffect(() => {
		if (isConnectedToCorrectChain !== latestConnectedToChain) {
			console.log(`Policy [BlockUpdater]: Connected to correct chain changed: ${isConnectedToCorrectChain}`);
			setLatestConnectedToChain(isConnectedToCorrectChain);
		}
	}, [isConnectedToCorrectChain, latestConnectedToChain]);

	// --------------------------------------------------------------------------------
	// Address / User changes
	useEffect(() => {
		if (!address && latestAddress) {
			setLatestAddress(undefined);
			console.log(`Policy [BlockUpdater]: Address reset`);
			store.dispatch(accountActions.resetAccountState());
		} else if (address && !latestAddress) {
			setLatestAddress(address);
			console.log(`Policy [BlockUpdater]: Address changed to: ${address}`);
			store.dispatch(fetchAccount(address));
		}
	}, [address, latestAddress]);

	// --------------------------------------------------------------------------------
	// Loading Guard
	if (initialized) {
		return <>{children}</>;
	} else {
		return <LoadingScreen />;
	}
}
