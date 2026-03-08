import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG, WAGMI_CHAINS } from "../../app.config";
import { toast } from "react-toastify";
import { shortenAddress } from "@utils";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useAccount, useChainId } from "wagmi";
import Button from "@components/Button";
import { Address, isAddress } from "viem";
import { ADDRESS, BridgedGovernanceABI, EquityABI } from "@frankencoin/zchf";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { mainnet } from "viem/chains";

interface Props {
	delegate: string;
	disabled?: boolean;
}

export default function GovernanceDelegationAction({ delegate, disabled }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const { address } = useAccount();
	const chainId = useChainId();

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!address || !isAddress(delegate)) return;

		try {
			setAction(true);

			const isMainnet = chainId === mainnet.id;
			const contractAddress = isMainnet ? ADDRESS[mainnet.id].equity : (ADDRESS as any)[chainId]?.ccipBridgedGovernance;
			const abi = isMainnet ? EquityABI : BridgedGovernanceABI;

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: contractAddress,
				chainId,
				abi,
				functionName: "delegateVoteTo",
				args: [delegate as Address],
			});

			const toastContent = [
				{
					title: "Owner: ",
					value: shortenAddress(address),
				},
				{
					title: "Delegate to: ",
					value: shortenAddress(delegate as Address),
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title="Supporting votes..." rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully supported votes" rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAction(false);
		}
	};

	return (
		<GuardSupportedChain chain={mainnet}>
			<Button className="h-10" disabled={disabled || !isAddress(delegate)} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
				Support Votes
			</Button>
		</GuardSupportedChain>
	);
}
