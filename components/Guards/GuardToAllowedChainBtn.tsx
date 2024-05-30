import React, { useEffect, useState } from "react";
import { useNetwork, useAccount, useChainId } from "wagmi";
import { useWeb3Modal, useWeb3ModalState } from "@web3modal/wagmi/react";
import Button from "@components/Button";

interface Props {
	children?: React.ReactNode;
}

export default function GuardToAllowedChainBtn(props: Props) {
	const [requestedChange, setRequestedChange] = useState(false);

	const Account = useAccount();
	const Network = useNetwork();
	const Web3Modal = useWeb3Modal();
	const Web3ModalState = useWeb3ModalState();

	const walletChain = Network.chain;
	const availableChains = Network.chains;
	const availableChainIds = availableChains.map((c) => c.id);
	const isCorrectChain = walletChain ? availableChainIds.includes(walletChain?.id) : false;

	// to close modal after successful connection or change of chain
	useEffect(() => {
		if (requestedChange && Account.isConnected && isCorrectChain && Web3ModalState.open) {
			Web3Modal.close();
			setRequestedChange(false);
		}
	}, [requestedChange, Account, isCorrectChain, Web3Modal, Web3ModalState]);

	// Check if wallet is disconnected
	if (Account.isDisconnected || !walletChain)
		return (
			<Button
				onClick={() => {
					Web3Modal.open();
					setRequestedChange(true);
				}}
			>
				Connect Wallet
			</Button>
		);

	// Check if wallet is connected to one of the available chains
	if (!isCorrectChain)
		return (
			<Button
				onClick={() => {
					Web3Modal.open({ view: "Networks" });
					setRequestedChange(true);
				}}
			>
				Change Chain
			</Button>
		);

	// render children
	return <>{props.children}</>;
}
