import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { useAppKit } from "@reown/appkit/react";
import { useConnection } from "wagmi";
import { mainnet } from "viem/chains";
import { ADDRESS, FPSWrapperABI } from "@frankencoin/zchf";
import AppButton from "@components/AppButton";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { track, useVotingPowers, useDelegationHelpers, QUORUM_RATIO } from "@hooks";
import { WAGMI_CONFIG } from "../../app.config";

// halveHoldingDuration() is gated by Equity.checkQualified — the FPS ledger specifically, not FCS —
// so qualification here is checked against "fps" directly rather than the FPS-then-FCS fallback that
// GuardQualifiedVoter/useQualifiedVotingSystem use for other actions.
export default function GovernanceWfpsHalveAction() {
	const [isAction, setAction] = useState<boolean>(false);
	const { address, isDisconnected } = useConnection();
	const AppKit = useAppKit();

	const { accountVoteData, isLoading } = useVotingPowers("fps");
	const { helpers } = useDelegationHelpers(address, "fps");

	const votingRatio = (accountVoteData?.votingPowerRatio ?? 0) + (accountVoteData?.supportedVotingPowerRatio ?? 0);
	const isQualified = votingRatio >= QUORUM_RATIO.fps;

	const handleOnClick = async (e: any) => {
		e.preventDefault();
		if (!isQualified) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[mainnet.id].wFPS,
				chainId: mainnet.id,
				abi: FPSWrapperABI,
				functionName: "halveHoldingDuration",
				args: [helpers],
			});

			const toastContent = [{ title: "Transaction: ", hash: writeHash }];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: { render: <TxToast title="Halving holding duration..." rows={toastContent} /> },
				success: { render: <TxToast title="Holding duration halved" rows={toastContent} /> },
			});

			track("wfps_holding_duration_halved");
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, FPSWrapperABI));
		} finally {
			setAction(false);
		}
	};

	if (isDisconnected)
		return (
			<AppButton width="w-auto" onClick={() => AppKit.open()}>
				Connect Wallet
			</AppButton>
		);

	if (isLoading)
		return (
			<AppButton width="w-auto" disabled isLoading>
				Loading...
			</AppButton>
		);

	if (!isQualified)
		return (
			<AppButton width="w-auto" disabled>
				Insufficient Votes
			</AppButton>
		);

	return (
		<GuardSupportedChain chain={mainnet} width="w-auto">
			<AppButton width="w-auto" isLoading={isAction} onClick={handleOnClick}>
				Halve Holding Duration
			</AppButton>
		</GuardSupportedChain>
	);
}
