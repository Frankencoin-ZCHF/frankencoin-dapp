import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useAppKit, useAppKitState, useAppKitNetwork } from "@reown/appkit/react";
import Button from "@components/Button";
import { WAGMI_CHAIN } from "../../app.config";
import { AppKitNetwork } from "@reown/appkit/networks";

interface Props {
	children?: React.ReactNode;
	label?: string;
	disabled?: boolean;
	chain?: AppKitNetwork;
}

export default function GuardSupportedChain({ children, label, disabled, chain }: Props) {
	const [requestedChange, setRequestedChange] = useState(false);

	const { isDisconnected, chainId } = useAccount();
	const AppKit = useAppKit();
	const AppKitState = useAppKitState();
	const AppKitNetwork = useAppKitNetwork();

	// load default chain
	if (chain == undefined) chain = WAGMI_CHAIN;

	// correct chain?
	const isCorrectChain = chain.id == chainId;

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
				disabled={disabled}
				onClick={() => {
					AppKit.open();
					setRequestedChange(true);
				}}
			>
				{label ?? "Connect Wallet"}
			</Button>
		);

	// Check if wallet is connected to the correct chains
	if (!isCorrectChain)
		return (
			<Button
				className="h-10"
				disabled={disabled}
				onClick={() => {
					AppKitNetwork.switchNetwork(chain);
					setRequestedChange(true);
				}}
			>
				{label ?? `Switch Chain (${chain.name})`}
			</Button>
		);

	// render children
	return <>{children}</>;
}
