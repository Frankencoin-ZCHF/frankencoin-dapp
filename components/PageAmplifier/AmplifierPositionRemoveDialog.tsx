import { useState } from "react";
import { erc20Abi, maxUint256 } from "viem";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import AppDialog from "@components/AppDialog";
import AppButton from "@components/AppButton";
import NormalInput from "@components/Input/NormalInput";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { WAGMI_CONFIG } from "../../app.config";
import { AmplifierStats } from "../../hooks/useAmplifier";
import { AmplifiedPositionInfo } from "../../hooks/useAmplifiedPositions";
import { AmplifiedPositionABI } from "../../abis/UniswapAmplifier";
import { formatBigInt, isDateExpired, shortenAddress } from "@utils";
import { getAmountsForLiquidity, getSqrtRatioAtTick } from "../../utils/uniswapV3Math";

interface Props {
	stats: AmplifierStats;
	position: AmplifiedPositionInfo;
	onClose: () => void;
}

/**
 * Dialog to remove a share of an amplified position's liquidity. The withdrawn ZCHF
 * side repays the proportional share of the debt; accrued fees are collected along the way.
 */
export default function AmplifierPositionRemoveDialog({ stats, position, onClose }: Props) {
	const [percent, setPercent] = useState("");
	const [isApproving, setApproving] = useState(false);
	const [isBurning, setBurning] = useState(false);

	const usdSymbol = stats.usdSymbol || "USD";
	const sqrtA = getSqrtRatioAtTick(position.tickLow);
	const sqrtB = getSqrtRatioAtTick(position.tickHigh);
	const sqrtP = stats.sqrtPriceX96;
	const usdIsToken0 = !stats.zchfIsToken0;
	const expired = stats.expiration > 0n && isDateExpired(stats.expiration);

	const percentNum = Math.floor(Number(percent || "0"));
	const validPercent = percentNum >= 0 && percentNum <= 100;
	const burnedLiquidity = validPercent ? (position.liquidity * BigInt(percentNum)) / 100n : 0n;
	const returned = sqrtP > 0n ? getAmountsForLiquidity(sqrtP, sqrtA, sqrtB, burnedLiquidity, false) : { amount0: 0n, amount1: 0n };
	const returnedUsd = usdIsToken0 ? returned.amount0 : returned.amount1;
	const returnedZchf = usdIsToken0 ? returned.amount1 : returned.amount0;
	const repaidZchf = position.liquidity > 0n ? (position.borrowed * burnedLiquidity) / position.liquidity : 0n;
	const shortfall = repaidZchf > returnedZchf ? repaidZchf - returnedZchf : 0n;

	// registered Frankencoin minters can burnFrom without an allowance; unregistered ones
	// (like the FrankencoinTestMinter) repay via transferFrom and need one
	const needsMinterApproval = !stats.minterIsRegistered && repaidZchf > stats.zchfMinterAllowance;

	// what ends up in the user's wallet, skipping zero amounts
	const netZchf = returnedZchf > repaidZchf ? returnedZchf - repaidZchf : 0n;
	const returnedParts: string[] = [];
	if (returnedUsd > 0n) returnedParts.push(`${formatBigInt(returnedUsd, stats.usdDecimals)} ${usdSymbol}`);
	if (netZchf > 0n) returnedParts.push(`${formatBigInt(netZchf)} ${stats.zchfSymbol}`);
	const returnsText = returnedParts.length > 0 ? `Returns about ${returnedParts.join(" and ")} to your wallet, plus accrued fees.` : "";

	let error = "";
	let warning = "";
	if (!validPercent) {
		error = "Please enter a percentage between 0 and 100.";
	} else if (position.liquidity == 0n) {
		error = "This position has no liquidity to remove.";
	} else if (shortfall > stats.zchfUserBalance) {
		error = `Repaying the debt requires about ${formatBigInt(shortfall)} ${stats.zchfSymbol} from your wallet on top of the withdrawn liquidity, but you only have ${formatBigInt(stats.zchfUserBalance)} ${stats.zchfSymbol}.`;
	} else if (shortfall > 0n) {
		const shortfallText = `About ${formatBigInt(shortfall)} ${stats.zchfSymbol} will be taken from your wallet to repay the debt.`;
		warning = returnsText ? `${returnsText} ${shortfallText}` : shortfallText;
	}

	const handleApproveMinter = async () => {
		try {
			setApproving(true);
			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: stats.zchf,
				chainId: stats.chainId,
				abi: erc20Abi,
				functionName: "approve",
				args: [stats.minter, maxUint256],
			});

			const toastContent = [
				{ title: "Amount:", value: "infinite" },
				{ title: "Spender: ", value: shortenAddress(stats.minter) },
				{ title: "Transaction:", hash: approveWriteHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: { render: <TxToast title={`Approving ${stats.zchfSymbol}`} rows={toastContent} /> },
				success: { render: <TxToast title={`Successfully Approved ${stats.zchfSymbol}`} rows={toastContent} /> },
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleBurn = async () => {
		try {
			setBurning(true);
			const burnWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.address,
				chainId: stats.chainId,
				abi: AmplifiedPositionABI,
				functionName: "burn",
				args: [burnedLiquidity, stats.priceX96],
			});

			const toastContent = [
				{ title: "Removed: ", value: percentNum + "% of the position's liquidity" },
				{ title: "Repaid: ", value: formatBigInt(repaidZchf) + " " + stats.zchfSymbol },
				{ title: "Transaction:", hash: burnWriteHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: burnWriteHash, confirmations: 1 }), {
				pending: { render: <TxToast title="Removing Liquidity" rows={toastContent} /> },
				success: { render: <TxToast title="Successfully Removed Liquidity" rows={toastContent} /> },
			});
			onClose();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setBurning(false);
		}
	};

	return (
		<AppDialog title="Remove Liquidity" isOpen={true} onClose={onClose} preventClose={isApproving || isBurning}>
			<div className="text-text-secondary">
				Withdraw a share of position {shortenAddress(position.address)}. The withdrawn {stats.zchfSymbol} repays the borrowed
				share, the rest goes to your wallet.
			</div>

			{expired && (
				<div className="text-text-warning">
					This amplifier has expired. Anyone can now close this position and collect its liquidity at your expense, so you should
					withdraw it now.
				</div>
			)}

			<NormalInput
				label="Share to remove"
				symbol="%"
				digit={0}
				value={percent}
				onChange={(value: string) => setPercent(value)}
				placeholder="0 - 100"
				error={percent !== "" ? error : ""}
				warning={warning}
				note={burnedLiquidity > 0n && !error ? returnsText : ""}
			/>

			<GuardSupportedChain>
				{needsMinterApproval ? (
					<AppButton
						disabled={!!error || burnedLiquidity == 0n}
						isLoading={isApproving}
						onClick={() => handleApproveMinter()}
						note={`The minter of this amplifier repays the debt via transferFrom and therefore needs an allowance for your ${stats.zchfSymbol}.`}
					>
						Approve {stats.zchfSymbol}
					</AppButton>
				) : (
					<AppButton disabled={!!error || burnedLiquidity == 0n} isLoading={isBurning} onClick={() => handleBurn()}>
						Remove Liquidity
					</AppButton>
				)}
			</GuardSupportedChain>
		</AppDialog>
	);
}
