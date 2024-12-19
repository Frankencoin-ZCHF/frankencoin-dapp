import { ChallengesQueryItem, PositionQuery, PositionsQueryObjectArray } from "@deuro/api";
import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { CONFIG_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { formatBigInt, TOKEN_SYMBOL } from "@utils";
import { renderErrorToast, renderErrorTxToast, TxToast } from "@components/TxToast";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import { Address } from "viem";
import { useAccount } from "wagmi";
import Button from "@components/Button";
import { ADDRESS, MintingHubV2ABI } from "@deuro/eurocoin";

interface Props {
	challenge: ChallengesQueryItem;
	hidden?: boolean;
}

export default function MyPositionsChallengesCancel({ challenge, hidden }: Props) {
	const [isCancelling, setCancelling] = useState<boolean>(false);
	const positions: PositionsQueryObjectArray = useSelector((state: RootState) => state.positions.mapping.map);
	const account = useAccount();
	const chainId = CONFIG_CHAIN().id;
	const [isHidden, setHidden] = useState<boolean>(
		hidden == true || challenge.status !== "Active" || account.address !== challenge.challenger
	);

	const handleCancelOnClick = async function () {
		const pid = challenge.position.toLowerCase() as Address;
		const p: PositionQuery = positions[pid];
		const n: number = parseInt(challenge.number.toString());
		const r = challenge.size - challenge.filledSize;

		if (!p) return;
		if (account.address !== challenge.challenger) return;

		try {
			setCancelling(true);

			const cancelWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].mintingHubV2,
				abi: MintingHubV2ABI,
				functionName: "bid",
				args: [n, r, false],
			});

			const toastContent = [
				{
					title: `Cancel Amount: `,
					value: formatBigInt(r, p.collateralDecimals) + " " + p.collateralSymbol,
				},
				{
					title: `Expected ${TOKEN_SYMBOL}: `,
					value: "0.00 " + TOKEN_SYMBOL,
				},
				{
					title: "Transaction:",
					hash: cancelWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: cancelWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Cancelling Challenge...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Cancelled Challenge" rows={toastContent} />,
				},
			});
			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setCancelling(false);
		}
	};

	return (
		<div className="">
			<Button className="h-10" disabled={isHidden} isLoading={isCancelling} onClick={() => handleCancelOnClick()}>
				Cancel
			</Button>
		</div>
	);
}
