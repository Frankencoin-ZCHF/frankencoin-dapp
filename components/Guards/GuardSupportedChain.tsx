import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useAppKit, useAppKitState, useAppKitNetwork } from "@reown/appkit/react";
import Button from "@components/Button";
import { WAGMI_CHAIN, WAGMI_CHAINS } from "../../app.config";
import { AppKitNetwork } from "@reown/appkit/networks";
import { ChainId } from "@frankencoin/zchf";

interface Props {
	children?: React.ReactNode;
	label?: string;
	disabled?: boolean;
	chain?: AppKitNetwork;
	chainId?: ChainId;
}

export default function GuardSupportedChain({ children, label, disabled, chain, chainId }: Props) {
	const [requestedChange, setRequestedChange] = useState(false);

	const Account = useAccount();
	const AppKit = useAppKit();
	const AppKitState = useAppKitState();
	const AppKitNetwork = useAppKitNetwork();

	// search chain from supported chainId
	if (chain == undefined && chainId != undefined) {
		chain = WAGMI_CHAINS.find((c) => c.id == chainId) as AppKitNetwork;
	}

	// load default chain
	if (chain == undefined) chain = WAGMI_CHAIN;

	// correct chain?
	const isCorrectChain = chain.id == Account.chainId;

	// to close modal after successful connection or change of chain
	useEffect(() => {
		if (requestedChange && isCorrectChain && AppKitState.open) {
			AppKit.close();
			setRequestedChange(false);
		}
	}, [requestedChange, isCorrectChain, AppKit, AppKitState]);

	// Check if wallet is disconnected
	if (Account.isDisconnected)
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
				<div className="truncate">{label ?? `Switch to ${chain.name}`}</div>
			</Button>
		);

	// render children
	return <>{children}</>;
}
