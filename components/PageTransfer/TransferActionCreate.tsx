import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { formatCurrency, shortenAddress } from "@utils";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useAccount, useChainId } from "wagmi";
import Button from "@components/Button";
import { Address, formatUnits } from "viem";
import { ADDRESS, ReferenceTransferABI } from "@frankencoin/zchf";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";

interface Props {
	recipient: Address;
	reference: string;
	amount: bigint;
	disabled?: boolean;
	setLoaded?: Dispatch<SetStateAction<boolean>>;
}

export default function TransferActionCreate({ recipient, reference, amount, disabled, setLoaded }: Props) {
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
				address: ADDRESS[chainId].referenceTransfer,
				abi: ReferenceTransferABI,
				functionName: "transfer",
				args: [recipient, amount, reference],
			});

			const toastContent = [
				{
					title: `Recipient: `,
					value: shortenAddress(recipient),
				},
				{
					title: `Reference: `,
					value: reference,
				},
				{
					title: `Transfer: `,
					value: `${formatCurrency(formatUnits(amount, 18))} ZCHF`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Transfer pending...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Transfer successful" rows={toastContent} />,
				},
			});

			if (setLoaded != undefined) setLoaded(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAction(false);
		}
	};

	return (
		<GuardToAllowedChainBtn>
			<Button className="h-10" disabled={isHidden || disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
				Transfer
			</Button>
		</GuardToAllowedChainBtn>
	);
}
