import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { shortenAddress } from "@utils";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { useAccount } from "wagmi";
import Button from "@components/Button";
import { maxUint256 } from "viem";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { ADDRESS, ERC20ABI } from "@frankencoin/zchf";
import { PositionQuery } from "@frankencoin/api";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";

interface Props {
	source: PositionQuery;
	disabled?: boolean;
}

export default function PositionRollerApproveAction({ source, disabled }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(false);
	const account = useAccount();

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: source.collateral,
				chainId: mainnet.id,
				abi: ERC20ABI,
				functionName: "approve",
				args: [ADDRESS[mainnet.id].rollerV2, maxUint256],
			});

			const toastContent = [
				{
					title: `Roller: `,
					value: shortenAddress(ADDRESS[mainnet.id].rollerV2),
				},
				{
					title: `Collateral: `,
					value: shortenAddress(source.collateral),
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Approving collateral for roller...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully approved collateral" rows={toastContent} />,
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
		<GuardSupportedChain disabled={isHidden || disabled} chain={mainnet}>
			<Button className="h-10" disabled={isHidden || disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
				Approve
			</Button>
		</GuardSupportedChain>
	);
}
