import { useState } from "react";
import { erc20Abi, maxUint256 } from "viem";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import AppDialog from "@components/AppDialog";
import AppButton from "@components/AppButton";
import TokenInput from "@components/Input/TokenInput";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { WAGMI_CONFIG } from "../../app.config";
import { AmplifierStats } from "../../hooks/useAmplifier";
import { AmplifiedPositionInfo } from "../../hooks/useAmplifiedPositions";
import { AmplifiedPositionABI } from "../../abis/UniswapAmplifier";
import { FormatType, formatBigInt, formatCurrency, isDateExpired, shortenAddress } from "@utils";
import { getAmountsForLiquidity, getLiquidityForAmount0, getLiquidityForAmount1, getSqrtRatioAtTick } from "../../utils/uniswapV3Math";
import { amplificationThresholdTick, qualifiesForAmplification } from "../../utils/amplifierMath";

interface Props {
	stats: AmplifierStats;
	position: AmplifiedPositionInfo;
	onClose: () => void;
}

/**
 * Dialog to add liquidity to an amplified position: the user provides dollars,
 * the matching ZCHF side is borrowed from the Frankencoin protocol.
 */
export default function AmplifierPositionAddDialog({ stats, position, onClose }: Props) {
	const [usdValue, setUsdValue] = useState("0");
	const [isApproving, setApproving] = useState(false);
	const [isApprovingZchf, setApprovingZchf] = useState(false);
	const [isMinting, setMinting] = useState(false);

	const usdSymbol = stats.usdSymbol || "USD";
	const sqrtA = getSqrtRatioAtTick(position.tickLow);
	const sqrtB = getSqrtRatioAtTick(position.tickHigh);
	const sqrtP = stats.sqrtPriceX96;
	const usdIsToken0 = !stats.zchfIsToken0;
	const expired = stats.expiration > 0n && isDateExpired(stats.expiration);

	// the dollars-per-ZCHF requirement is a ratio fixed by the range and the current price,
	// so whether it is met does not depend on the amount the user enters
	const priceUnit = `${stats.zchfSymbol}/${usdSymbol}`;
	let rangeError = "";
	if (sqrtP > 0n) {
		const outOfRange = usdIsToken0 ? sqrtP >= sqrtB : sqrtP <= sqrtA;
		if (expired) {
			rangeError = "The amplifier has expired, no new liquidity can be added.";
		} else if (outOfRange) {
			rangeError = `At the current price, this range would consist entirely of borrowed ${stats.zchfSymbol}, which the amplifier does not allow. Create a position with a different range instead.`;
		} else if (!qualifiesForAmplification(sqrtP, sqrtA, sqrtB, stats.priceAnchorX96, usdIsToken0)) {
			const thresholdTick = amplificationThresholdTick(position.tickLow, position.tickHigh, stats.priceAnchorX96, usdIsToken0);
			const threshold = stats.zchfPerUsdAtTick(thresholdTick);
			rangeError = `At the current price of ${formatCurrency(stats.pricePerUsd, 2, 4, FormatType.us)} ${priceUnit}, this range would borrow too much ${stats.zchfSymbol} relative to the provided ${usdSymbol} — a larger amount does not change this ratio. Adding liquidity becomes possible once the price reaches about ${formatCurrency(threshold, 2, 4, FormatType.us)} ${priceUnit}. Create a new position with a higher price range.`;
		}
	}

	// derive the liquidity amount from the dollars the user wants to provide
	const usdInput = BigInt(usdValue || "0");
	let liquidity = 0n;
	let usdNeeded = 0n;
	let zchfBorrowed = 0n;
	let amountError = "";

	if (sqrtP > 0n && usdInput > 0n && !rangeError) {
		liquidity = usdIsToken0
			? getLiquidityForAmount0(sqrtP > sqrtA ? sqrtP : sqrtA, sqrtB, usdInput)
			: getLiquidityForAmount1(sqrtA, sqrtP < sqrtB ? sqrtP : sqrtB, usdInput);
	}
	if (liquidity > 0n) {
		const amounts = getAmountsForLiquidity(sqrtP, sqrtA, sqrtB, liquidity, true);
		usdNeeded = usdIsToken0 ? amounts.amount0 : amounts.amount1;
		zchfBorrowed = usdIsToken0 ? amounts.amount1 : amounts.amount0;
		if (stats.totalBorrowed + zchfBorrowed > stats.limit) {
			amountError = "Adding this liquidity would exceed the amplifier's borrowing limit.";
		} else if (usdNeeded > stats.usdUserBalance) {
			amountError = `Not enough ${usdSymbol} in your wallet.`;
		} else if (stats.minterDeposit !== undefined && zchfBorrowed > stats.minterDeposit) {
			amountError = `The test minter can only hand out ${stats.zchfSymbol} you have deposited to it, and your deposit of ${formatBigInt(
				stats.minterDeposit
			)} ${stats.zchfSymbol} does not cover the ${formatBigInt(zchfBorrowed)} ${stats.zchfSymbol} to be borrowed. See the note at the top of the page.`;
		}
	}
	const error = rangeError || amountError;

	const handleApprove = async () => {
		try {
			setApproving(true);
			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: stats.usd,
				chainId: stats.chainId,
				abi: erc20Abi,
				functionName: "approve",
				args: [stats.address!, maxUint256],
			});

			const toastContent = [
				{ title: "Amount:", value: "infinite" },
				{ title: "Spender: ", value: shortenAddress(stats.address!) },
				{ title: "Transaction:", hash: approveWriteHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: { render: <TxToast title={`Approving ${usdSymbol}`} rows={toastContent} /> },
				success: { render: <TxToast title={`Successfully Approved ${usdSymbol}`} rows={toastContent} /> },
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleApproveZchf = async () => {
		try {
			setApprovingZchf(true);
			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: stats.zchf,
				chainId: stats.chainId,
				abi: erc20Abi,
				functionName: "approve",
				args: [stats.address!, maxUint256],
			});

			const toastContent = [
				{ title: "Amount:", value: "infinite" },
				{ title: "Spender: ", value: shortenAddress(stats.address!) },
				{ title: "Transaction:", hash: approveWriteHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: { render: <TxToast title={`Approving ${stats.zchfSymbol}`} rows={toastContent} /> },
				success: { render: <TxToast title={`Successfully Approved ${stats.zchfSymbol}`} rows={toastContent} /> },
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApprovingZchf(false);
		}
	};

	const handleMint = async () => {
		try {
			setMinting(true);
			const mintWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.address,
				chainId: stats.chainId,
				abi: AmplifiedPositionABI,
				functionName: "mint",
				args: [liquidity, stats.priceX96],
			});

			const toastContent = [
				{ title: `${usdSymbol} Amount: `, value: formatBigInt(usdNeeded, stats.usdDecimals) + " " + usdSymbol },
				{ title: "Borrowed: ", value: formatBigInt(zchfBorrowed) + " " + stats.zchfSymbol },
				{ title: "Transaction:", hash: mintWriteHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: mintWriteHash, confirmations: 1 }), {
				pending: { render: <TxToast title="Adding Liquidity" rows={toastContent} /> },
				success: { render: <TxToast title="Successfully Added Liquidity" rows={toastContent} /> },
			});
			onClose();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setMinting(false);
		}
	};

	return (
		<AppDialog title="Add Liquidity" isOpen={true} onClose={onClose} preventClose={isApproving || isApprovingZchf || isMinting}>
			<div className="text-text-secondary">
				Provide {usdSymbol} to position {shortenAddress(position.address)}. The matching {stats.zchfSymbol} side is borrowed from
				the Frankencoin protocol.
			</div>

			<TokenInput
				label="Provide"
				symbol={usdSymbol}
				digit={stats.usdDecimals}
				max={stats.usdUserBalance}
				reset={0n}
				limit={stats.usdUserBalance}
				limitDigit={stats.usdDecimals}
				limitLabel="Balance"
				placeholder="Amount"
				value={usdValue}
				onChange={(value: string) => setUsdValue(value)}
				error={usdInput > 0n ? error : rangeError}
				note={
					zchfBorrowed > 0n && !error
						? `Borrows ${formatBigInt(zchfBorrowed)} ${stats.zchfSymbol} from the Frankencoin protocol on your behalf.`
						: ""
				}
			/>

			<GuardSupportedChain>
				{usdNeeded > stats.usdUserAllowance ? (
					<AppButton disabled={!!error || liquidity == 0n} isLoading={isApproving} onClick={() => handleApprove()}>
						Approve {usdSymbol}
					</AppButton>
				) : zchfBorrowed > stats.zchfAmplifierAllowance ? (
					<AppButton
						disabled={!!error || liquidity == 0n}
						isLoading={isApprovingZchf}
						onClick={() => handleApproveZchf()}
						note={`The amplifier moves the borrowed ${stats.zchfSymbol} from your address into the pool and needs an allowance for that.`}
					>
						Approve {stats.zchfSymbol}
					</AppButton>
				) : (
					<AppButton disabled={!!error || liquidity == 0n} isLoading={isMinting} onClick={() => handleMint()}>
						Add Liquidity
					</AppButton>
				)}
			</GuardSupportedChain>
		</AppDialog>
	);
}
