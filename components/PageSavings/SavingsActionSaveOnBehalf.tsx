import { Dispatch, SetStateAction, useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { formatCurrency, shortenAddress } from "@utils";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useAccount, useChainId } from "wagmi";
import Button from "@components/Button";
import { Address, formatUnits } from "viem";
import { ADDRESS, SavingsABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";

interface Props {
	amount: bigint;
	onBehalf: Address;
	disabled?: boolean;
	setLoaded?: (val: boolean) => Dispatch<SetStateAction<boolean>>;
}

export default function SavingsActionSaveOnBehalf({ amount, onBehalf, disabled, setLoaded }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(false);
	const account = useAccount();
	const chainId = mainnet.id;

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].savingsReferral,
				chainId: chainId,
				abi: SavingsABI,
				functionName: "save",
				args: [onBehalf, amount],
			});

			const toastContent = [
				{
					title: `Saving: `,
					value: `${formatCurrency(formatUnits(amount, 18))} ZCHF`,
				},
				{
					title: `Target: `,
					value: shortenAddress(onBehalf),
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Save to target...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Saved" rows={toastContent} />,
				},
			});

			// setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			if (setLoaded != undefined) setLoaded(false);
			setAction(false);
		}
	};

	return (
		<GuardSupportedChain chain={mainnet}>
			<Button className="h-10" disabled={isHidden || disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
				Save to Target
			</Button>
		</GuardSupportedChain>
	);
}
