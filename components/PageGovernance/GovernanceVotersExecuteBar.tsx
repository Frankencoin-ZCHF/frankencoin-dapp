import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import AppCard from "@components/AppCard";
import AppButtonSecondary from "@components/AppButtonSecondary";
import DisplayLabel from "@components/DisplayLabel";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { formatCurrency, FormatType } from "../../utils/format";
import { VotingSystem } from "@hooks";
import { ADDRESS, EquityABI, FCSABI } from "@frankencoin/zchf";
import { Address, formatUnits } from "viem";
import { mainnet } from "viem/chains";
import { WAGMI_CONFIG } from "../../app.config";

interface Props {
	system: VotingSystem;
	targets: Address[];
	myVotes: bigint;
	accumulatedVotes: bigint;
	votesToDestroy: bigint;
	selectedCount: number;
	onCleared: () => void;
	onExecuted: () => void;
}

export default function GovernanceVotersExecuteBar({
	system,
	targets,
	myVotes,
	accumulatedVotes,
	votesToDestroy,
	selectedCount,
	onCleared,
	onExecuted,
}: Props) {
	const [isAction, setAction] = useState<boolean>(false);

	const contractAddress = system === "fcs" ? ADDRESS[mainnet.id].fcs : ADDRESS[mainnet.id].equity;
	const abi = system === "fcs" ? FCSABI : EquityABI;
	const isExecuteDisabled = votesToDestroy === 0n;
	const willDestroyRatio = myVotes > 0n ? Number(votesToDestroy) / Number(myVotes) : 0;

	const handleExecute = async (e: any) => {
		e.preventDefault();
		if (isExecuteDisabled) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: contractAddress,
				chainId: mainnet.id,
				abi,
				functionName: system === "fcs" ? "attack" : "kamikaze",
				args: [targets, votesToDestroy],
			});

			const toastContent = [
				{ title: "Targets: ", value: `${selectedCount}` },
				{ title: "Transaction: ", hash: writeHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: { render: <TxToast title="Kamikaze in progress..." rows={toastContent} /> },
				success: { render: <TxToast title="Kamikaze successful" rows={toastContent} /> },
			});

			onExecuted();
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, abi));
		} finally {
			setAction(false);
		}
	};

	return (
		<AppCard className="p-4 flex flex-wrap items-center justify-between gap-4">
			<div className="flex flex-wrap gap-6">
				<DisplayLabel label={`${selectedCount} address${selectedCount !== 1 ? "es" : ""} selected`}>
					<div className="font-semibold">{formatCurrency(formatUnits(accumulatedVotes, 18), 2, 2, FormatType.symbol)} accumulated votes</div>
				</DisplayLabel>
				<DisplayLabel label="Your budget">
					<div className="font-semibold">{formatCurrency(formatUnits(myVotes, 18), 2, 2, FormatType.symbol)} votes</div>
				</DisplayLabel>
				<DisplayLabel label="Will consume">
					<div className="font-semibold">{formatCurrency(willDestroyRatio * 100)}% of your budget</div>
				</DisplayLabel>
			</div>
			<div className="flex gap-2">
				<AppButtonSecondary width="w-auto" onClick={onCleared} disabled={isAction}>
					Clear
				</AppButtonSecondary>
				<GuardSupportedChain chain={mainnet}>
					<AppButtonSecondary width="w-auto" disabled={isExecuteDisabled} isLoading={isAction} onClick={handleExecute}>
						Execute Kamikaze
					</AppButtonSecondary>
				</GuardSupportedChain>
			</div>
		</AppCard>
	);
}
