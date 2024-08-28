import { MinterQuery } from "@frankencoin/api";
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

interface Props {
	disabled?: boolean;
}

// TODO: make correct action call
export default function GovernanceVotersAction({ disabled }: Props) {
	const [isVetoing, setVetoing] = useState<boolean>(false);
	const account = useAccount();
	const chainId = CONFIG.chain.id;
	const [isHidden, setHidden] = useState<boolean>(false);

	const handleCancelOnClick = async function () {
		if (!account.address) return;

		const m = zeroAddress;
		const h = [] as Address[];
		const msg = "No";

		try {
			setVetoing(true);

			const cancelWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frankenCoin,
				abi: ABIS.FrankencoinABI,
				functionName: "denyMinter",
				args: [m, h, msg],
			});

			const toastContent = [
				{
					title: `Veto minter: `,
					value: shortenAddress(m),
				},
				{
					title: `Deny Message: `,
					value: msg,
				},
				{
					title: "Transaction: ",
					hash: cancelWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: cancelWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Vetoing minter...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully vetoed minter" rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});

			setHidden(true);
		} finally {
			setVetoing(false);
		}
	};

	return (
		<div className="">
			<GuardToAllowedChainBtn disabled={isHidden || disabled}>
				<Button
					className="h-10"
					variant="primary"
					disabled={isHidden || disabled}
					isLoading={isVetoing}
					onClick={() => handleCancelOnClick()}
				>
					Delegate
				</Button>
			</GuardToAllowedChainBtn>
		</div>
	);
}
