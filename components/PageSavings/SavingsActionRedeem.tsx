import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useAccount, useChainId } from "wagmi";
import Button from "@components/Button";
import { ADDRESS, SavingsABI } from "@frankencoin/zchf";

interface Props {
	disabled?: boolean;
	setLoaded?: (val: boolean) => Dispatch<SetStateAction<boolean>>;
}

export default function SavingsActionRedeem({ disabled, setLoaded }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(true);
	const { address } = useAccount();
	const chainId = useChainId();

	useEffect(() => {
		if (address == undefined) return;

		const fetcher = async () => {
			const [saved, ticks] = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].savings,
				abi: SavingsABI,
				functionName: "savings",
				args: [address],
			});

			setHidden(saved == 0n);
		};

		fetcher();
	}, [address, chainId]);

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!address) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].savings,
				abi: SavingsABI,
				functionName: "adjust",
				args: [0n],
			});

			const toastContent = [
				{
					title: `Saved amount: `,
					value: `0 ZCHF`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Redeeming from savings...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully redeemed" rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			if (setLoaded != undefined) setLoaded(false);
			setAction(false);
		}
	};

	return isHidden || !address ? null : (
		<Button className="h-10" disabled={isHidden || disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
			Redeem from older Version
		</Button>
	);
}
