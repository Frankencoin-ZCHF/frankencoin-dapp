import React from "react";
import { useConnection } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import AppButton from "@components/AppButton";
import { useVotingPowers } from "../../hooks/useVotingPowers";

const VETO_THRESHOLD = 0.02; // 2%

interface Props {
	children?: React.ReactNode;
	disabled?: boolean;
}

export default function GuardQualifiedVoter({ children, disabled }: Props) {
	const { isDisconnected } = useConnection();
	const AppKit = useAppKit();
	const { accountVoteData, isLoading } = useVotingPowers();

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

	const combinedRatio = (accountVoteData?.votingPowerRatio ?? 0) + (accountVoteData?.supportedVotingPowerRatio ?? 0);
	const isQualified = combinedRatio >= VETO_THRESHOLD;

	if (!isQualified) return <AppButton disabled>Insufficient Votes</AppButton>;

	return <>{children}</>;
}
