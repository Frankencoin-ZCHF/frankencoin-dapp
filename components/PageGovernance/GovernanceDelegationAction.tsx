import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { shortenAddress } from "@utils";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useConnection } from "wagmi";
import AppButton from "@components/AppButton";
import { Address, isAddress } from "viem";
import { ADDRESS, EquityABI, MainnetVotesABI } from "@frankencoin/zchf";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { track, VotingSystem } from "@hooks";
import { mainnet } from "viem/chains";

interface Props {
	delegate: string;
	disabled?: boolean;
	system?: VotingSystem;
}

// Mainnet-only by design: local sidechain delegation is fragile — BridgedGovernance/BridgedVotes'
// _ccipReceive unconditionally overwrites the delegate the next time anyone syncs that address from
// mainnet, so this button never offers it (enforced below via GuardSupportedChain).
export default function GovernanceDelegationAction({ delegate, disabled, system = "fps1" }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const { address } = useConnection();

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!address || !isAddress(delegate)) return;

		try {
			setAction(true);

			const isFcs = system === "fcs";
			const contractAddress = isFcs ? ADDRESS[mainnet.id].mainnetVotes : ADDRESS[mainnet.id].equity;
			const abi = isFcs ? MainnetVotesABI : EquityABI;

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: contractAddress,
				chainId: mainnet.id,
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

			track("votes_delegated", { system });
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAction(false);
		}
	};

	return (
		<GuardSupportedChain chain={mainnet}>
			<AppButton className="h-10" disabled={disabled || !isAddress(delegate)} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
				Support Address
			</AppButton>
		</GuardSupportedChain>
	);
}
