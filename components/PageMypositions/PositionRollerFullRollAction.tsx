import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { shortenAddress } from "@utils";
import { renderErrorTxToast, renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { useAccount } from "wagmi";
import Button from "@components/Button";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { ADDRESS, ERC20ABI, PositionRollerV2ABI, PositionV2ABI } from "@frankencoin/zchf";
import { PositionQuery } from "@frankencoin/api";
import { zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";

interface Props {
	label?: string;
	source: PositionQuery;
	target: PositionQuery;
	disabled?: boolean;
}

export default function PositionRollerFullRollAction({ label = "Roll", source, target, disabled }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(false);
	const { address } = useAccount();
	const account = address || zeroAddress;

	const isTargetOwned = target.owner.toLowerCase() === account.toLowerCase();

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (account == zeroAddress) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[mainnet.id].rollerV2,
				chainId: mainnet.id,
				abi: PositionRollerV2ABI,
				functionName: "rollFully",
				args: [source.position, target.position],
			});

			const toastContent = [
				{
					title: `Rolling from: `,
					value: shortenAddress(source.position),
				},
				{
					title: `${isTargetOwned ? "Merging" : "Rolling"} to: `,
					value: shortenAddress(target.position),
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`${isTargetOwned ? "Merging" : "Rolling"} position...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully ${isTargetOwned ? "merged" : "rolled"} position`} rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			// toast.error(renderErrorTxToast(error));
			toast.error(renderErrorTxToastDecode(error, PositionV2ABI));
		} finally {
			setAction(false);
		}
	};

	return (
		<GuardSupportedChain disabled={isHidden || disabled} chain={mainnet}>
			<Button className="h-10" disabled={isHidden || disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
				{label}
			</Button>
		</GuardSupportedChain>
	);
}
