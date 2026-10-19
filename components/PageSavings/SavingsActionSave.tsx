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
	interest: bigint;
	disabled?: boolean;
	newReferrer?: Address;
	newReferralFeePPM: bigint;
	onSuccess?: () => void;
}

/**
 * Deposits `amount` via save(amount), or save(amount, referrer, feePPM) when a referrer is to be set.
 * The module collects the accrued interest into the balance before adding the deposit.
 * With an amount of zero, the button reinvests the accrued interest via refreshMyBalance() instead,
 * which unlike save() does not restart the three-day interest delay (and save(0) reverts on empty accounts).
 */
export default function SavingsActionSave({ savingsModule, amount, interest, disabled, newReferrer, newReferralFeePPM, onSuccess }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const { address } = useConnection();
	const chainId = useChainId() as ChainId;
	const chain = getChain(chainId);
	const reinvest = amount == 0n && interest > 0n;

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!address) return;

		try {
			setAction(true);

			const writeHash = reinvest
				? await writeContract(WAGMI_CONFIG, {
						account: address,
						address: savingsModule,
						chainId: chainId,
						abi: SavingsABI,
						functionName: "refreshMyBalance",
				  })
				: await writeContract(WAGMI_CONFIG, {
						account: address,
						address: savingsModule,
						chainId: chainId,
						abi: SavingsABI,
						functionName: "save",
						args: newReferrer != undefined ? [amount, newReferrer, Number(newReferralFeePPM)] : [amount],
				  });

			const toastContent = [
				{
					title: reinvest ? `Reinvest: ` : `Deposit: `,
					value: `${formatCurrency(formatUnits(reinvest ? interest : amount, 18))} ZCHF`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, chainId, confirmations: 1 }), {
				pending: {
					render: <TxToast title={reinvest ? `Reinvesting interest...` : `Depositing into savings...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={reinvest ? "Interest added to your savings" : "Successfully deposited"} rows={toastContent} />,
				},
			});

			if (reinvest) track("interest_reinvested", { amount: formatUnits(interest, 18) });
			else track("savings_deposited", { amount: formatUnits(amount, 18) });
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
				{reinvest ? "Reinvest interest" : "Deposit"}
			</AppButton>
		</GuardSupportedChain>
	);
}
