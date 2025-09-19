import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Button from "@components/Button";
import { useIsConnectedToCorrectChain } from "../../hooks/useWalletConnectStats";
import { useTranslation } from "next-i18next";
import { CONFIG } from "../../app.config";

interface Props {
	children?: React.ReactNode;
	label?: string;
	disabled?: boolean;
	buttonClassName?: string;
}

export default function GuardToAllowedChainBtn(props: Props) {
	const [requestedChange, setRequestedChange] = useState(false);

	const { isDisconnected } = useAccount();
	const isCorrectChain = useIsConnectedToCorrectChain();
	const { t } = useTranslation();

	// Only use Web3Modal if it's initialized
	let Web3Modal: any = null;
	let Web3ModalState: any = null;
	if (CONFIG.wagmiId) {
		try {
			const { useWeb3Modal, useWeb3ModalState } = require("@web3modal/wagmi/react");
			Web3Modal = useWeb3Modal();
			Web3ModalState = useWeb3ModalState();
		} catch (e) {
			console.warn("Web3Modal not available");
		}
	}

	// to close modal after successful connection or change of chain
	useEffect(() => {
		if (requestedChange && isCorrectChain && Web3ModalState?.open && Web3Modal) {
			Web3Modal.close();
			setRequestedChange(false);
		}
	}, [requestedChange, isCorrectChain, Web3Modal, Web3ModalState]);

	const handleConnect = () => {
		if (Web3Modal) {
			Web3Modal.open();
			setRequestedChange(true);
		} else {
			console.warn("Wallet connection not available - missing Project ID");
		}
	};

	const handleNetworkSwitch = () => {
		if (Web3Modal) {
			Web3Modal.open({ view: "Networks" });
			setRequestedChange(true);
		} else {
			console.warn("Network switch not available - missing Project ID");
		}
	};

	// Check if wallet is disconnected
	if (isDisconnected)
		return (
			<Button
				className={`h-10 ${props.buttonClassName}`}
				disabled={props.disabled || !Web3Modal}
				onClick={handleConnect}
			>
				{props?.label ?? t("common.connect_wallet")}
			</Button>
		);

	// Check if wallet is connected to one of the available chains
	if (!isCorrectChain)
		return (
			<Button
				className={`h-10 ${props.buttonClassName}`}
				disabled={props.disabled || !Web3Modal}
				onClick={handleNetworkSwitch}
			>
				{props?.label ?? "Change Chain"}
			</Button>
		);

	// render children
	return <>{props.children}</>;
}
