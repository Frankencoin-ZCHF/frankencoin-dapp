import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useWeb3Modal, useWeb3ModalState } from "@web3modal/wagmi/react";
import Button from "@components/Button";
import { useIsConnectedToCorrectChain } from "../../hooks/useWalletConnectStats";

interface Props {
	children?: React.ReactNode;
	label?: string;
	disabled?: boolean;
	buttonClassName?: string;
}

export default function GuardToAllowedChainBtn(props: Props) {
	const [requestedChange, setRequestedChange] = useState(false);

	const { isDisconnected } = useAccount();
	const Web3Modal = useWeb3Modal();
	const Web3ModalState = useWeb3ModalState();
	const isCorrectChain = useIsConnectedToCorrectChain();

	// to close modal after successful connection or change of chain
	useEffect(() => {
		if (requestedChange && isCorrectChain && Web3ModalState.open) {
			Web3Modal.close();
			setRequestedChange(false);
		}
	}, [requestedChange, isCorrectChain, Web3Modal, Web3ModalState]);

	// Check if wallet is disconnected
	if (isDisconnected)
		return (
			<Button
				className={`h-10 ${props.buttonClassName}`}
				disabled={props.disabled}
				onClick={() => {
					Web3Modal.open();
					setRequestedChange(true);
				}}
			>
				{props?.label ?? "Connect Wallet"}
			</Button>
		);

	// Check if wallet is connected to one of the available chains
	if (!isCorrectChain)
		return (
			<Button
				className={`h-10 ${props.buttonClassName}`}
				disabled={props.disabled}
				onClick={() => {
					Web3Modal.open({ view: "Networks" });
					setRequestedChange(true);
				}}
			>
				{props?.label ?? "Change Chain"}
			</Button>
		);

	// render children
	return <>{props.children}</>;
}
