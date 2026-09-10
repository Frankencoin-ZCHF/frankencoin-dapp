import { MinterQuery } from "@frankencoin/api";
import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { shortenAddress } from "@utils";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { useConnection } from "wagmi";
import AppButton from "@components/AppButton";
import { Address, Chain } from "viem";
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
}

export default function GovernanceMintersAction({ minter, disabled }: Props) {
	const [isVetoing, setVetoing] = useState<boolean>(false);
	const account = useConnection();
	const chainId = minter.chainId as ChainId;
	const [isHidden, setHidden] = useState<boolean>(false);
	const { system, helpers } = useQualifiedVotingSystem(account.address);

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		const m = minter.minter;
		const msg = "No";

		try {
			setVetoing(true);

			// FCS-qualified callers go through MinterGovernance (per-chain, same as MinterGovernance
			// itself) instead of Frankencoin directly — Frankencoin.denyMinter checks the caller's own
			// Equity-side qualification, which an FCS-only holder doesn't have.
			const writeHash =
				system === "fcs"
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
			toast.error(renderErrorTxToastDecode(error, system === "fcs" ? MinterGovernanceABI : EquityABI));
		} finally {
			setVetoing(false);
		}
	};

	return (
		<GuardQualifiedVoter disabled={isHidden || disabled}>
			<GuardSupportedChain disabled={isHidden || disabled} chain={SupportedChainsMap[chainId] as Chain}>
				<AppButton className="h-10" disabled={isHidden || disabled} isLoading={isVetoing} onClick={(e) => handleOnClick(e)}>
					Veto
				</AppButton>
			</GuardSupportedChain>
		</GuardQualifiedVoter>
	);
}
