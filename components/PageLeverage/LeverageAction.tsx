import { useState } from "react";
import { erc20Abi, maxUint256, Address, zeroAddress } from "viem";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { PositionQuery } from "@frankencoin/api";
import { WAGMI_CONFIG } from "../../app.config";
import { formatBigInt, getEnsoRoute, shortenAddress, toTimestamp, LEVERAGE_EXECUTOR_ABI, LEVERAGE_EXECUTOR_ADDRESS } from "@utils";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import AppButton from "@components/AppButton";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { mainnet } from "viem/chains";

export type LeverageMode = "zchf" | "collateral";

interface Props {
	position: PositionQuery;
	mode: LeverageMode;
	equityToken: { address: Address; symbol: string; decimals: number };
	equity: bigint;
	collateralAmount: bigint; // C, deposited into the position
	swapIn: bigint; // ZCHF swapped into collateral after the mint
	slippageBps: number;
	expirationDate: Date;
	userAllowance: bigint;
	userBalance: bigint;
	disabled?: boolean;
}

export default function LeverageAction({
	position,
	mode,
	equityToken,
	equity,
	collateralAmount,
	swapIn,
	slippageBps,
	expirationDate,
	userAllowance,
	userBalance,
	disabled,
}: Props) {
	const [isApproving, setApproving] = useState(false);
	const [isExecuting, setExecuting] = useState(false);

	const executorDeployed = LEVERAGE_EXECUTOR_ADDRESS !== zeroAddress;

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveHash = await writeContract(WAGMI_CONFIG, {
				address: equityToken.address,
				abi: erc20Abi,
				functionName: "approve",
				args: [LEVERAGE_EXECUTOR_ADDRESS, maxUint256],
			});

			const toastContent = [
				{ title: "Amount:", value: `infinite ${equityToken.symbol}` },
				{ title: "Spender:", value: shortenAddress(LEVERAGE_EXECUTOR_ADDRESS) },
				{ title: "Transaction:", hash: approveHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveHash, confirmations: 1 }), {
				pending: { render: <TxToast title={`Approving ${equityToken.symbol}`} rows={toastContent} /> },
				success: { render: <TxToast title={`Successfully Approved ${equityToken.symbol}`} rows={toastContent} /> },
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleExecute = async () => {
		try {
			setExecuting(true);

			// The swap calldata is quoted right before sending; Enso quotes go stale quickly.
			const route = await getEnsoRoute({
				chainId: mainnet.id,
				fromAddress: LEVERAGE_EXECUTOR_ADDRESS,
				receiver: LEVERAGE_EXECUTOR_ADDRESS,
				spender: LEVERAGE_EXECUTOR_ADDRESS,
				amountIn: [swapIn.toString()],
				tokenIn: [position.zchf as Address],
				tokenOut: [position.collateral as Address],
				slippage: slippageBps,
				routingStrategy: "router",
			});

			const hash = await writeContract(WAGMI_CONFIG, {
				address: LEVERAGE_EXECUTOR_ADDRESS,
				chainId: mainnet.id,
				abi: LEVERAGE_EXECUTOR_ABI,
				functionName: mode == "zchf" ? "executeWithZCHF" : "executeWithCollateral",
				args: [position.position as Address, equity, collateralAmount, toTimestamp(expirationDate), route.tx.data as `0x${string}`],
			});

			const toastContent = [
				{ title: "Equity:", value: `${formatBigInt(equity, equityToken.decimals)} ${equityToken.symbol}` },
				{
					title: "Collateral:",
					value: `${formatBigInt(collateralAmount, position.collateralDecimals)} ${position.collateralSymbol}`,
				},
				{ title: "Transaction:", hash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash, confirmations: 1 }), {
				pending: { render: <TxToast title="Opening Leveraged Position" rows={toastContent} /> },
				success: { render: <TxToast title="Leveraged Position Opened" rows={toastContent} /> },
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setExecuting(false);
		}
	};

	if (!executorDeployed) {
		return (
			<GuardSupportedChain chain={mainnet}>
				<AppButton disabled={true}>Executor contract not yet deployed</AppButton>
			</GuardSupportedChain>
		);
	}

	return (
		<GuardSupportedChain chain={mainnet}>
			{/* TODO: undo */}
			{/* {equity > userAllowance ? (
				<AppButton disabled={disabled || equity > userBalance} isLoading={isApproving} onClick={handleApprove}>
					Approve {equityToken.symbol}
				</AppButton>
			) : ( */}
			<AppButton isLoading={isExecuting} onClick={handleExecute}>
				Open Leveraged Position
			</AppButton>
			{/* )} */}
		</GuardSupportedChain>
	);
}
