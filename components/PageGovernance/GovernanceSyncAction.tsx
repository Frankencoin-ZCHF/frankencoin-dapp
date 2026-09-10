import { useState } from "react";
import { waitForTransactionReceipt, writeContract, readContract } from "wagmi/actions";
import { WAGMI_CONFIG, WAGMI_CHAINS } from "../../app.config";
import { toast } from "react-toastify";
import { formatCurrency } from "@utils";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useConnection } from "wagmi";
import AppButton from "@components/AppButton";
import { Address, formatUnits } from "viem";
import { ADDRESS, GovernanceSenderABI, MainnetVotesABI } from "@frankencoin/zchf";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { track, VotingSystem } from "@hooks";
import { mainnet } from "viem/chains";

interface Props {
	targetChainId: number;
	voters: Address[];
	disabled?: boolean;
	system?: VotingSystem;
}

export default function GovernanceSyncAction({ targetChainId, voters, disabled, system = "fps1" }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const { address } = useConnection();
	const isFcs = system === "fcs";

	const targetChain = WAGMI_CHAINS.find((c) => c.id === targetChainId);
	const targetChainSelector = BigInt((ADDRESS as any)[targetChainId]?.chainSelector ?? 0);
	const receiverAddress = (ADDRESS as any)[targetChainId]?.[isFcs ? "bridgedVotes" : "ccipBridgedGovernance"] as Address | undefined;

	const isReady = !!receiverAddress && targetChainSelector > 0n && voters.length > 0;

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!address || !isReady) return;

		try {
			setAction(true);

			// FCS syncs directly off mainnetVotes (it's a CCIPSender itself) — FPS1 goes through the
			// separate ccipGovernanceSender contract.
			const senderAddress = isFcs ? ADDRESS[mainnet.id].mainnetVotes : ADDRESS[mainnet.id].ccipGovernanceSender;
			const senderAbi = isFcs ? MainnetVotesABI : GovernanceSenderABI;
			const feeFunctionName = isFcs ? "getFCSSyncFee" : "getCCIPFee";
			const pushFunctionName = isFcs ? "pushFCSVotes" : "pushVotes";

			const fee = (await readContract(WAGMI_CONFIG, {
				address: senderAddress,
				chainId: mainnet.id,
				abi: senderAbi,
				functionName: feeFunctionName,
				args: [targetChainSelector, receiverAddress!, voters, true],
			} as any)) as bigint;

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: senderAddress,
				chainId: mainnet.id,
				abi: senderAbi,
				functionName: pushFunctionName,
				args: [targetChainSelector, receiverAddress!, voters],
				value: (fee * 12n) / 10n,
			} as any);

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

			track("votes_synced", { chain: targetChain?.name, voters: voters.length, system });
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAction(false);
		}
	};

	return (
		<GuardSupportedChain chainId={mainnet.id}>
			<AppButton className="h-10" disabled={disabled || !isReady} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
				Sync to {targetChain?.name ?? String(targetChainId)}
			</AppButton>
		</GuardSupportedChain>
	);
}
