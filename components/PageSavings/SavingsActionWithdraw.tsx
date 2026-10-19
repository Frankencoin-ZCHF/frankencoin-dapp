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
	withdrawAll: boolean;
	disabled?: boolean;
	onSuccess?: () => void;
}

/**
 * Partial withdrawals use withdraw(owner, amount). Full withdrawals use adjust(0) instead, which also
 * sweeps the interest accrued between reading the balance and mining the transaction, leaving exactly zero.
 */
export default function SavingsActionWithdraw({ savingsModule, amount, withdrawAll, disabled, onSuccess }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const { address } = useConnection();
	const chainId = useChainId() as ChainId;
	const chain = getChain(chainId);

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!address) return;

		try {
			setAction(true);

			const writeHash = withdrawAll
				? await writeContract(WAGMI_CONFIG, {
						account: address,
						address: savingsModule,
						chainId: chainId,
						abi: SavingsABI,
						functionName: "adjust",
						args: [0n],
				  })
				: await writeContract(WAGMI_CONFIG, {
						account: address,
						address: savingsModule,
						chainId: chainId,
						abi: SavingsABI,
						functionName: "withdraw",
						args: [address, amount],
				  });

			const toastContent = [
				{
					title: `Withdraw: `,
					value: withdrawAll
						? `All (~${formatCurrency(formatUnits(amount, 18))} ZCHF)`
						: `${formatCurrency(formatUnits(amount, 18))} ZCHF`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, chainId, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Withdrawing from savings...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully withdrawn" rows={toastContent} />,
				},
			});

			track("savings_withdrawn", { amount: formatUnits(amount, 18), all: withdrawAll });
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
				{withdrawAll ? "Withdraw all" : "Withdraw"}
			</AppButton>
		</GuardSupportedChain>
	);
}
