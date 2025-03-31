import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useAppKit, useAppKitState, useAppKitNetwork } from "@reown/appkit/react";
import Button from "@components/Button";
import { useIsConnectedToCorrectChain } from "../../hooks/useWalletConnectStats";
import { WAGMI_CHAIN } from "../../app.config";

interface Props {
	children?: React.ReactNode;
	label?: string;
	disabled?: boolean;
}

export default function GuardToAllowedChainBtn(props: Props) {
	const [requestedChange, setRequestedChange] = useState(false);

	const { isDisconnected } = useAccount();
	const AppKit = useAppKit();
	const AppKitState = useAppKitState();
	const AppKitNetwork = useAppKitNetwork();
	const isCorrectChain = useIsConnectedToCorrectChain();

	// to close modal after successful connection or change of chain
	useEffect(() => {
		if (requestedChange && isCorrectChain && AppKitState.open) {
			AppKit.close();
			setRequestedChange(false);
		}
	}, [requestedChange, isCorrectChain, AppKit, AppKitState]);

	// Check if wallet is disconnected
	if (isDisconnected)
		return (
			<Button
				className="h-10"
				disabled={props.disabled}
				onClick={() => {
					AppKit.open();
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
				className="h-10"
				disabled={props.disabled}
				onClick={() => {
					AppKitNetwork.switchNetwork(WAGMI_CHAIN);
					setRequestedChange(true);
				}}
			>
				{props?.label ?? "Change Chain"}
			</Button>
		);

	// render children
	return <>{props.children}</>;
}
