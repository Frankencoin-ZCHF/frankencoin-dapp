import { useState } from "react";
import { waitForTransactionReceipt, writeContract, readContract } from "wagmi/actions";
import { WAGMI_CONFIG, WAGMI_CHAINS } from "../../app.config";
import { toast } from "react-toastify";
import { formatCurrency } from "@utils";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useAccount } from "wagmi";
import Button from "@components/Button";
import { Address, formatUnits } from "viem";
import { ADDRESS, GovernanceSenderABI } from "@frankencoin/zchf";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { mainnet } from "viem/chains";

interface Props {
	targetChainId: number;
	voters: Address[];
	disabled?: boolean;
}

export default function GovernanceSyncAction({ targetChainId, voters, disabled }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const { address } = useAccount();

	const targetChain = WAGMI_CHAINS.find((c) => c.id === targetChainId);
	const targetChainSelector = BigInt((ADDRESS as any)[targetChainId]?.chainSelector ?? 0);
	const receiverAddress = (ADDRESS as any)[targetChainId]?.ccipBridgedGovernance as Address | undefined;

	const isReady = !!receiverAddress && targetChainSelector > 0n && voters.length > 0;

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!address || !isReady) return;

		try {
			setAction(true);

			const fee = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[mainnet.id].ccipGovernanceSender,
				chainId: mainnet.id,
				abi: GovernanceSenderABI,
				functionName: "getCCIPFee",
				args: [targetChainSelector, receiverAddress!, voters, true],
			});

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[mainnet.id].ccipGovernanceSender,
				chainId: mainnet.id,
				abi: GovernanceSenderABI,
				functionName: "pushVotes",
				args: [targetChainSelector, receiverAddress!, voters],
				value: (fee * 12n) / 10n,
			});

			const toastContent = [
				{
					title: "Target chain: ",
					value: targetChain?.name ?? String(targetChainId),
				},
				{
					title: "Voters synced: ",
					value: String(voters.length),
				},
				{
					title: "CCIP fee: ",
					value: `${formatCurrency(formatUnits(fee, 18))} ETH`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title="Syncing votes to chain..." rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully synced votes" rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAction(false);
		}
	};

	return (
		<GuardSupportedChain chainId={mainnet.id}>
			<Button
				className="h-10"
				disabled={disabled || !isReady}
				isLoading={isAction}
				onClick={(e) => handleOnClick(e)}
			>
				Sync to {targetChain?.name ?? String(targetChainId)}
			</Button>
		</GuardSupportedChain>
	);
}
