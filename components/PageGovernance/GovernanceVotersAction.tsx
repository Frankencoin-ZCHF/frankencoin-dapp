import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { CONFIG, WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { shortenAddress } from "@utils";
import { renderErrorToast, renderErrorTxToast, TxToast } from "@components/TxToast";
import { useAccount } from "wagmi";
import Button from "@components/Button";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { VoteData } from "./GovernanceVotersTable";
import { ADDRESS, EquityABI } from "@frankencoin/zchf";

interface Props {
	voter: VoteData;
	disabled?: boolean;
	connectedWallet?: boolean;
}

export default function GovernanceVotersAction({ voter, disabled, connectedWallet }: Props) {
	const [isDelegating, setDelegating] = useState<boolean>(false);
	const account = useAccount();
	const chainId = CONFIG.chain.id;
	const [isHidden, setHidden] = useState<boolean>(false);

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;
		const addr = voter.holder;

		try {
			setDelegating(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				abi: EquityABI,
				functionName: "delegateVoteTo",
				args: [voter.holder],
			});

			const toastContent = [
				{
					title: `Owner: `,
					value: shortenAddress(account.address),
				},
				{
					title: `Delegete to: `,
					value: shortenAddress(addr),
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Delegating votes...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully delegated votes" rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setDelegating(false);
		}
	};

	return (
		<div className="">
			<GuardToAllowedChainBtn label={connectedWallet ? "Revoke" : "Delegate"} disabled={isHidden || disabled}>
				<div className="overflow-hidden">
					<Button
						className="h-10 scroll-nopeak"
						disabled={isHidden || disabled}
						isLoading={isDelegating}
						onClick={(e) => handleOnClick(e)}
					>
						{connectedWallet ? "Revoke" : "Delegate"}
					</Button>
				</div>
			</GuardToAllowedChainBtn>
		</div>
	);
}
