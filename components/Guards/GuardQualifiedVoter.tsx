import React from "react";
import { useConnection } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import AppButton from "@components/AppButton";
import { useQualifiedVotingSystem } from "@hooks";

interface Props {
	children?: React.ReactNode;
	disabled?: boolean;
}

// FPS is the default/primary qualification check; FCS is only consulted as a fallback when FPS alone
// doesn't qualify. Each system is checked against its own real on-chain quorum (2% FPS, 1% FCS) — see
// useQualifiedVotingSystem, the single source of truth also used by the actions this guard wraps to pick
// which contract path (and whose helpers) to actually write to.
export default function GuardQualifiedVoter({ children, disabled }: Props) {
	const { address, isDisconnected } = useConnection();
	const AppKit = useAppKit();

	const { isQualified, isLoading } = useQualifiedVotingSystem(address);

	if (isDisconnected)
		return (
			<AppButton disabled={disabled} onClick={() => AppKit.open()}>
				Connect Wallet
			</AppButton>
		);

	if (isLoading)
		return (
			<AppButton disabled isLoading>
				Loading...
			</AppButton>
		);

	if (!isQualified) return <AppButton disabled>Insufficient Votes</AppButton>;

	return <>{children}</>;
}
