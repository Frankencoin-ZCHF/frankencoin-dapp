import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { formatCurrency } from "@utils";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useConnection, useChainId } from "wagmi";
import AppButtonSecondary from "@components/AppButtonSecondary";
import { Address, formatUnits } from "viem";
import { track } from "@hooks";
import { ChainId, SavingsABI } from "@frankencoin/zchf";

interface Props {
	savingsModule: Address;
	saved: bigint;
	interest: bigint;
	disabled?: boolean;
	onSuccess?: () => void;
}

/**
 * Withdraws only the accrued interest via adjust(saved): the module first collects the interest into the
 * balance (paying the referrer, if any) and then withdraws back down to the previous principal.
 * @dev: checkout if you want to return back to "claim" into savings account, aka reinvest via SC function "refreshMyBalance"
 * https://github.com/Frankencoin-ZCHF/frankencoin-dapp/blob/b1356dc0e45157b0e65b20fef019af00e5126653/components/PageSavings/SavingsActionInterest.tsx
 */
export default function SavingsActionInterest({ savingsModule, saved, interest, disabled, onSuccess }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const { address } = useConnection();
	const chainId = useChainId() as ChainId;

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
				functionName: "adjust",
				args: [saved],
			});

			const toastContent = [
				{
					title: `Withdraw interest: `,
					value: `~${formatCurrency(formatUnits(interest, 18))} ZCHF`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, chainId, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Withdrawing interest...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Interest withdrawn" rows={toastContent} />,
				},
			});

			track("interest_claimed", { amount: formatUnits(interest, 18) });
			onSuccess?.();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAction(false);
		}
	};

	return (
		<AppButtonSecondary className="h-10" disabled={disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
			Withdraw interest only ({formatCurrency(formatUnits(interest, 18))} ZCHF)
		</AppButtonSecondary>
	);
}
