import { Dispatch, SetStateAction, useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { formatCurrency } from "@utils";
import { TxToast } from "@components/TxToast";
import { useAccount, useChainId } from "wagmi";
import Button from "@components/Button";
import { formatUnits } from "viem";
import { ADDRESS, SavingsABI } from "@frankencoin/zchf";

interface Props {
	balance: bigint;
	amount: bigint;
	disabled?: boolean;
	setLoaded?: (val: boolean) => Dispatch<SetStateAction<boolean>>;
}

export default function SavingsActionWithdraw({ balance, amount, disabled, setLoaded }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(false);
	const account = useAccount();
	const chainId = useChainId();

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].savings,
				abi: SavingsABI,
				functionName: "save",
				args: [amount],
			});

			const toastContent = [
				{
					title: `Saved amount: `,
					value: `${formatCurrency(formatUnits(balance, 18))} ZCHF`,
				},
				{
					title: `Withdraw: `,
					value: `${formatCurrency(formatUnits(amount, 18))} ZCHF`,
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

			setHidden(true);
		} catch (error) {
			toast.error(<TxToast title="Something did not work..." rows={[{ title: "Did you reject the Transaction?" }]} />, {
				position: toast.POSITION.BOTTOM_RIGHT,
			});
		} finally {
			if (setLoaded != undefined) setLoaded(false);
			setAction(false);
		}
	};

	return (
		<Button className="h-10" disabled={isHidden || disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
			Withdraw
		</Button>
	);
}