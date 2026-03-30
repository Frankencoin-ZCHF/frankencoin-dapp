import { useState } from "react";
import { erc20Abi, maxUint256, decodeEventLog, parseUnits } from "viem";
import { Address } from "viem";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { useChainId } from "wagmi";
import { toast } from "react-toastify";
import { PositionQuery } from "@frankencoin/api";
import { ADDRESS, CloneHelperABI, MintingHubV2ABI } from "@frankencoin/zchf";
import { WAGMI_CONFIG } from "../../app.config";
import { formatBigInt, shortenAddress, toTimestamp } from "@utils";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import Button from "@components/Button";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { mainnet } from "viem/chains";
import { useRouter } from "next/navigation";

interface Props {
	position: PositionQuery;
	collAmount: bigint;
	requiredColl: bigint;
	amount: bigint;
	expirationDate: Date;
	newPrice: number;
	userAllowance: bigint;
	userBalance: bigint;
	disabled?: boolean;
}

export default function BorrowClonePriceAction({
	position,
	collAmount,
	requiredColl,
	amount,
	expirationDate,
	newPrice,
	userAllowance,
	userBalance,
	disabled,
}: Props) {
	const [isApproving, setApproving] = useState(false);
	const [isCloning, setCloning] = useState(false);
	const chainId = useChainId();
	const navigate = useRouter();

	const cloneHelper = ADDRESS[mainnet.id].cloneHelper;

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.collateral as Address,
				abi: erc20Abi,
				functionName: "approve",
				args: [cloneHelper, maxUint256],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: "infinite " + position.collateralSymbol,
				},
				{
					title: "Spender: ",
					value: shortenAddress(cloneHelper),
				},
				{
					title: "Transaction:",
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Approving ${position.collateralSymbol}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully Approved ${position.collateralSymbol}`} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleCloneWithPrice = async () => {
		try {
			setCloning(true);

			const expirationTime = toTimestamp(expirationDate);
			const priceBigInt = parseUnits(String(newPrice), 36 - position.collateralDecimals);

			const cloneWriteHash = await writeContract(WAGMI_CONFIG, {
				address: cloneHelper,
				chainId: mainnet.id,
				abi: CloneHelperABI,
				functionName: "cloneWithPrice",
				args: [position.position, requiredColl, amount, expirationTime, priceBigInt],
			});

			const toastContent = [
				{
					title: `Amount: `,
					value: formatBigInt(amount) + " ZCHF",
				},
				{
					title: `Collateral: `,
					value: formatBigInt(requiredColl, position.collateralDecimals) + " " + position.collateralSymbol,
				},
				{
					title: "Transaction:",
					hash: cloneWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: cloneWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Minting ZCHF`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Minted ZCHF" rows={toastContent} />,
				},
			});

			const receipt = await waitForTransactionReceipt(WAGMI_CONFIG, {
				chainId: mainnet.id,
				hash: cloneWriteHash,
				confirmations: 1,
			});

			const targetEvents = receipt.logs
				.map((log) => {
					try {
						return decodeEventLog({
							abi: MintingHubV2ABI,
							data: log.data,
							topics: log.topics,
						});
					} catch {
						return null;
					}
				})
				.filter((event) => event !== null && event.eventName === "PositionOpened");

			if (targetEvents.length > 0) {
				const newPosition = (targetEvents[0].args as { position: Address }).position;
				navigate.push(`/mypositions/${newPosition}`);
			}
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setCloning(false);
		}
	};

	return (
		<GuardSupportedChain chain={mainnet}>
			{requiredColl > userAllowance ? (
				<Button disabled={disabled || requiredColl > userBalance} isLoading={isApproving} onClick={() => handleApprove()}>
					Approve
				</Button>
			) : (
				<Button disabled={disabled || requiredColl > userBalance} isLoading={isCloning} onClick={() => handleCloneWithPrice()}>
					Borrow
				</Button>
			)}
		</GuardSupportedChain>
	);
}
