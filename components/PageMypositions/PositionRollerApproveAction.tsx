import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { formatCurrency, shortenAddress } from "@utils";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { useAccount } from "wagmi";
import Button from "@components/Button";
import { Address, formatUnits, maxUint256 } from "viem";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { ADDRESS, EquityABI, ERC20ABI, FrankencoinABI } from "@frankencoin/zchf";

interface Props {
	amount: bigint;
	disabled?: boolean;
}

export default function PositionRollerApproveAction({ amount, disabled }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(false);
	const account = useAccount();

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[WAGMI_CHAIN.id].frankenCoin,
				abi: FrankencoinABI,
				functionName: "approve",
				args: [ADDRESS[WAGMI_CHAIN.id].roller, maxUint256],
			});

			const toastContent = [
				{
					title: `Roller: `,
					value: shortenAddress(ADDRESS[WAGMI_CHAIN.id].roller),
				},
				{
					title: `Amount: `,
					value: formatCurrency(formatUnits(amount, 18), 2, 2) + " ZCHF",
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Approving roller...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully approved roller" rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, ERC20ABI));
		} finally {
			setAction(false);
		}
	};

	return (
		<GuardToAllowedChainBtn label="Approve" disabled={isHidden || disabled}>
			<Button className="h-10" disabled={isHidden || disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
				Approve
			</Button>
		</GuardToAllowedChainBtn>
	);
}
