import { useState } from "react";
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
	amount: bigint;
	disabled?: boolean;
	newReferrer?: Address;
	newReferralFeePPM: bigint;
	onSuccess?: () => void;
}

/**
 * Deposits `amount` via save(amount), or save(amount, referrer, feePPM) when a referrer is to be set.
 * The module collects the accrued interest into the balance before adding the deposit.
 */
export default function SavingsActionSave({ savingsModule, amount, disabled, newReferrer, newReferralFeePPM, onSuccess }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const { address } = useConnection();
	const chainId = useChainId() as ChainId;
	const chain = getChain(chainId);

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!address) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				account: address,
				address: savingsModule,
				chainId: chainId,
				abi: SavingsABI,
				functionName: "save",
				args: newReferrer != undefined ? [amount, newReferrer, Number(newReferralFeePPM)] : [amount],
			});

			const toastContent = [
				{
					title: `Deposit: `,
					value: `${formatCurrency(formatUnits(amount, 18))} ZCHF`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, chainId, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Depositing into savings...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully deposited" rows={toastContent} />,
				},
			});

			track("savings_deposited", { amount: formatUnits(amount, 18) });
			onSuccess?.();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAction(false);
		}
	};

	return (
		<GuardSupportedChain chain={chain}>
			<AppButton className="h-10" disabled={disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
				Deposit
			</AppButton>
		</GuardSupportedChain>
	);
}
