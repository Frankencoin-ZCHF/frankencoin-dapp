import { Dispatch, SetStateAction, useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { formatCurrency, getChain } from "@utils";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useConnection, useChainId } from "wagmi";
import AppButton from "@components/AppButton";
import { Address, formatUnits } from "viem";
import { track } from "@hooks";
import { ChainId, SavingsABI } from "@frankencoin/zchf";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";

interface Props {
	savingsModule: Address;
	balance: bigint;
	change: bigint;
	disabled?: boolean;
	setLoaded?: (val: boolean) => Dispatch<SetStateAction<boolean>>;
	newReferrer?: Address | undefined;
	newReferralFeePPM: bigint;
}

export default function SavingsActionWithdraw({
	savingsModule,
	balance,
	change,
	disabled,
	setLoaded,
	newReferrer,
	newReferralFeePPM,
}: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(false);
	const account = useConnection();
	const chainId = useChainId() as ChainId;
	const chain = getChain(chainId);

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: savingsModule,
				chainId: chainId,
				abi: SavingsABI,
				functionName: "adjust",
				args: newReferrer != undefined ? [balance, newReferrer, Number(newReferralFeePPM)] : [balance],
			});

			const toastContent = [
				{
					title: `Saved amount: `,
					value: `${formatCurrency(formatUnits(balance, 18))} ZCHF`,
				},
				{
					title: `Withdraw: `,
					value: `${formatCurrency(formatUnits(change, 18))} ZCHF`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Withdrawing from savings...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully withdrawn" rows={toastContent} />,
				},
			});

			track("savings_withdrawn", { amount: formatUnits(change, 18) });
			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			if (setLoaded != undefined) setLoaded(false);
			setAction(false);
		}
	};

	return (
		<GuardSupportedChain chain={chain}>
			<AppButton className="h-10" disabled={isHidden || disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
				Adjust
			</AppButton>
		</GuardSupportedChain>
	);
}
