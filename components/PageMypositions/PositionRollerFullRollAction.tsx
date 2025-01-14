import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { shortenAddress } from "@utils";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { useAccount } from "wagmi";
import Button from "@components/Button";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { ADDRESS, PositionRollerABI, PositionV2ABI } from "@frankencoin/zchf";
import { PositionQuery } from "@frankencoin/api";

interface Props {
	label?: string;
	source: PositionQuery;
	target: PositionQuery;
	disabled?: boolean;
}

export default function PositionRollerFullRollAction({ label = "Roll", source, target, disabled }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(false);
	const account = useAccount();

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[WAGMI_CHAIN.id].roller,
				abi: PositionRollerABI,
				functionName: "rollFully",
				args: [source.position, target.position],
			});

			const toastContent = [
				{
					title: `Rolling from: `,
					value: shortenAddress(source.position),
				},
				{
					title: `Rolling to: `,
					value: shortenAddress(target.position),
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Rolling position...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully rolled position" rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, PositionV2ABI));
			// toast.error(renderErrorTxToast(error));
		} finally {
			setAction(false);
		}
	};

	return (
		<GuardToAllowedChainBtn label={label} disabled={isHidden || disabled}>
			<Button className="h-10" disabled={isHidden || disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
				{label}
			</Button>
		</GuardToAllowedChainBtn>
	);
}
