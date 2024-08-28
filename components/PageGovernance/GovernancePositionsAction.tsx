import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { CONFIG, WAGMI_CONFIG } from "../../app.config";
import { ABIS, ADDRESS } from "@contracts";
import { toast } from "react-toastify";
import { shortenAddress } from "@utils";
import { renderErrorToast, TxToast } from "@components/TxToast";
import { useAccount } from "wagmi";
import Button from "@components/Button";
import { Address, zeroAddress } from "viem";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { PositionQuery } from "@frankencoin/api";

interface Props {
	position: PositionQuery;
	disabled?: boolean;
}

export default function GovernancePositionsAction({ position, disabled }: Props) {
	const [isDenying, setDenying] = useState<boolean>(false);
	const account = useAccount();
	const chainId = CONFIG.chain.id;
	const [isHidden, setHidden] = useState<boolean>(false);

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		const h = [] as Address[];
		const msg = "No";

		try {
			setDenying(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: position.position,
				abi: ABIS.PositionABI,
				functionName: "deny",
				args: [h, msg],
			});

			const toastContent = [
				{
					title: `Deny position: `,
					value: shortenAddress(position.position),
				},
				{
					title: `Deny Message: `,
					value: msg,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Denying position...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully denied position" rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});

			setHidden(true);
		} finally {
			setDenying(false);
		}
	};

	return (
		<div className="">
			<GuardToAllowedChainBtn disabled={isHidden || disabled}>
				<Button
					className="h-10"
					variant="primary"
					disabled={isHidden || disabled}
					isLoading={isDenying}
					onClick={(e) => handleOnClick(e)}
				>
					Deny
				</Button>
			</GuardToAllowedChainBtn>
		</div>
	);
}
