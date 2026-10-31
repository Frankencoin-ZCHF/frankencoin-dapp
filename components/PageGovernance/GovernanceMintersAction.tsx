import { MinterQuery } from "@frankencoin/api";
import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { formatCurrency, shortenAddress } from "@utils";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { useConnection } from "wagmi";
import AppButton from "@components/AppButton";
import { Address, Chain, formatUnits } from "viem";
import {
	ADDRESS,
	ChainId,
	ChainIdMain,
	ChainIdSide,
	EquityABI,
	FrankencoinABI,
	MinterGovernanceABI,
	SupportedChainsMap,
} from "@frankencoin/zchf";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import GuardQualifiedVoter from "@components/Guards/GuardQualifiedVoter";
import { useQualifiedVotingSystem } from "@hooks";

interface Props {
	minter: MinterQuery;
	disabled: boolean;
	// minter was applied for directly on Frankencoin, bypassing MinterGovernance.suggestMinter
	unannounced?: boolean;
	// ZCHF paid out by denyUnannouncedMinter
	reward?: bigint;
}

export default function GovernanceMintersAction({ minter, disabled, unannounced = false, reward = 0n }: Props) {
	const [isVetoing, setVetoing] = useState<boolean>(false);
	const account = useConnection();
	const chainId = minter.chainId as ChainId;
	const [isHidden, setHidden] = useState<boolean>(false);
	const { system, helpers } = useQualifiedVotingSystem(account.address);
	const rewardStr = `${formatCurrency(formatUnits(reward, 18))} ZCHF`;

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		const m = minter.minter;
		// @dev: denyUnannouncedMinter always records "FCS" as the deny message
		const msg = unannounced ? "FCS" : "No";

		try {
			setVetoing(true);

			// Unannounced minters can be vetoed by anyone via MinterGovernance, which also pays out a reward.
			// Otherwise, FCS-qualified callers go through MinterGovernance (per-chain, same as MinterGovernance
			// itself) instead of Frankencoin directly — Frankencoin.denyMinter checks the caller's own
			// Equity-side qualification, which an FCS-only holder doesn't have.
			const writeHash = unannounced
				? await writeContract(WAGMI_CONFIG, {
						address: (ADDRESS as any)[chainId]?.minterGovernance,
						chainId: chainId,
						abi: MinterGovernanceABI,
						functionName: "denyUnannouncedMinter",
						args: [m],
				  })
				: system === "fcs"
				? await writeContract(WAGMI_CONFIG, {
						address: (ADDRESS as any)[chainId]?.minterGovernance,
						chainId: chainId,
						abi: MinterGovernanceABI,
						functionName: "denyMinter",
						args: [m, helpers, msg],
				  })
				: await writeContract(WAGMI_CONFIG, {
						address:
							chainId == 1
								? ADDRESS[chainId as ChainIdMain].frankencoin
								: ADDRESS[chainId as ChainIdSide].ccipBridgedFrankencoin,
						chainId: chainId,
						abi: FrankencoinABI,
						functionName: "denyMinter",
						args: [m, helpers, msg],
				  });

			const toastContent = [
				{
					title: `Veto minter: `,
					value: shortenAddress(m),
				},
				{
					title: `Deny Message: `,
					value: msg,
				},
				...(unannounced
					? [
							{
								title: `Reward: `,
								value: rewardStr,
							},
					  ]
					: []),
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Vetoing minter...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully vetoed minter" rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, unannounced || system === "fcs" ? MinterGovernanceABI : EquityABI));
		} finally {
			setVetoing(false);
		}
	};

	const vetoButton = (
		<GuardSupportedChain disabled={isHidden || disabled} chain={SupportedChainsMap[chainId] as Chain}>
			<AppButton className="h-10" disabled={isHidden || disabled} isLoading={isVetoing} onClick={(e) => handleOnClick(e)}>
				Veto
			</AppButton>
		</GuardSupportedChain>
	);

	// denyUnannouncedMinter can be called by anyone, no voting power needed
	if (unannounced) return vetoButton;

	return <GuardQualifiedVoter disabled={isHidden || disabled}>{vetoButton}</GuardQualifiedVoter>;
}
