import { useState } from "react";
import { erc20Abi, maxUint256, zeroHash, Hash, decodeEventLog } from "viem";
import { Address } from "viem";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { useAccount, useChainId } from "wagmi";
import { toast } from "react-toastify";
import { PositionQuery } from "@frankencoin/api";
import { ADDRESS, MintingHubV1ABI, MintingHubV2ABI } from "@frankencoin/zchf";
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
	userAllowance: bigint;
	userBalance: bigint;
	disabled?: boolean;
}

export default function BorrowCloneAction({
	position,
	collAmount,
	requiredColl,
	amount,
	expirationDate,
	userAllowance,
	userBalance,
	disabled,
}: Props) {
	const [isApproving, setApproving] = useState(false);
	const [isCloning, setCloning] = useState(false);
	const { address } = useAccount();
	const chainId = useChainId();
	const navigate = useRouter();

	const spender = position.version == 1 ? ADDRESS[mainnet.id].mintingHubV1 : ADDRESS[mainnet.id].mintingHubV2;

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.collateral as Address,
				abi: erc20Abi,
				functionName: "approve",
				args: [spender, maxUint256],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: "infinite " + position.collateralSymbol,
				},
				{
					title: "Spender: ",
					value: shortenAddress(spender),
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

	const handleClone = async () => {
		try {
			setCloning(true);
			const expirationTime = toTimestamp(expirationDate);
			let cloneWriteHash: Hash = zeroHash;

			if (position.version == 1) {
				cloneWriteHash = await writeContract(WAGMI_CONFIG, {
					address: ADDRESS[mainnet.id].mintingHubV1,
					chainId: mainnet.id,
					abi: MintingHubV1ABI,
					functionName: "clone",
					args: [position.position, requiredColl, amount, BigInt(expirationTime)],
				});
			} else if (position.version == 2) {
				cloneWriteHash = await writeContract(WAGMI_CONFIG, {
					address: ADDRESS[mainnet.id].mintingHubV2,
					chainId: mainnet.id,
					abi: MintingHubV2ABI,
					functionName: "clone",
					args: [position.position, requiredColl, amount, expirationTime],
				});
			}

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
							abi: position.version == 1 ? MintingHubV1ABI : MintingHubV2ABI,
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
				<Button
					disabled={disabled || requiredColl > userBalance}
					isLoading={isApproving}
					onClick={() => handleApprove()}
				>
					Approve
				</Button>
			) : (
				<Button
					disabled={disabled || requiredColl > userBalance}
					isLoading={isCloning}
					onClick={() => handleClone()}
				>
					Borrow
				</Button>
			)}
		</GuardSupportedChain>
	);
}
