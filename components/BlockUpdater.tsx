import { Address, useAccount, useBlockNumber } from 'wagmi';
import { useEffect, useState } from 'react';

import { store } from '../redux/redux.store';
import { fetchPositionsList } from '../redux/slices/positions.slice';
import { fetchPricesList } from '../redux/slices/prices.slice';
import { fetchAccount } from '../redux/slices/account.slice';
import { ERC20Info } from '../redux/slices/positions.types';

export default function BockUpdater() {
	const { error, data } = useBlockNumber({ enabled: true, watch: true });
	const { address } = useAccount();
	const [latestHeight, setLatestHeight] = useState<number>(0);
	const [latestMintERC20Infos, setLatestMintERC20Infos] = useState<ERC20Info[]>([]);
	const [latestCollateralERC20Infos, setLatestCollateralERC20Infos] = useState<ERC20Info[]>([]);
	const [latestAddress, setLatestAddress] = useState<Address | undefined>(undefined);
	const { mintERC20Infos, collateralERC20Infos } = store.getState().positions;

	// --------------------------------------------------------------------------------
	// Init
	// FIXME: does it solve the init step for loading all data
	useEffect(() => {
		console.log(`Policy [BlockUpdater]: ONCE / INIT`);
		// store.dispatch(fetchPositionsList());
	}, []);

	// --------------------------------------------------------------------------------
	// Bock update policies
	useEffect(() => {
		if (!data || error) return;
		const fetchedLatestHeight: number = parseInt(data.toString());

		// New block? set new state
		if (fetchedLatestHeight <= latestHeight) return;
		setLatestHeight(fetchedLatestHeight);

		// Block update policy: EACH BLOCK
		console.log(`Policy [BlockUpdater]: EACH BLOCK ${fetchedLatestHeight}`);
		store.dispatch(fetchPositionsList());
		if (latestAddress) store.dispatch(fetchAccount(latestAddress));

		// Block update policy: EACH 10 BLOCKS
		if (fetchedLatestHeight % 10 != 0) return;
		console.log(`Policy [BlockUpdater]: EACH 10 BLOCKS ${fetchedLatestHeight}`);
		store.dispatch(fetchPricesList(store.getState()));

		// Block update policy: EACH 100 BLOCKS
		if (fetchedLatestHeight % 100 != 0) return;
		console.log(`Policy [BlockUpdater]: EACH 100 BLOCKS ${fetchedLatestHeight}`);
		// store.dispatch(fetchPricesList());
	}, [error, data, latestHeight, latestAddress]);

	// --------------------------------------------------------------------------------
	// ERC20 Info changes
	useEffect(() => {
		if (mintERC20Infos.length == 0 || collateralERC20Infos.length == 0) return;

		if (mintERC20Infos.length != latestMintERC20Infos.length) setLatestMintERC20Infos(mintERC20Infos);
		if (collateralERC20Infos.length != latestCollateralERC20Infos.length) setLatestCollateralERC20Infos(collateralERC20Infos);

		console.log(`Policy [BlockUpdater]: ERC20 Info changed`);
		store.dispatch(fetchPricesList(store.getState()));
	}, [mintERC20Infos, collateralERC20Infos, latestMintERC20Infos, latestCollateralERC20Infos]);

	// --------------------------------------------------------------------------------
	// Address / User changes
	useEffect(() => {
		if (!address) return;
		if (!latestAddress) setLatestAddress(address);

		console.log(`Policy [BlockUpdater]: Address changed to: ${address}`);
		store.dispatch(fetchAccount(address));
	}, [address, latestAddress]);

	return null;
}
