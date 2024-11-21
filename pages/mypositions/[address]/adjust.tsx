import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { formatUnits, maxUint256, erc20Abi, Address, parseUnits } from "viem";
import Head from "next/head";
import TokenInput from "@components/Input/TokenInput";
import { abs, formatBigInt, formatCurrency, shortenAddress } from "@utils";
import Button from "@components/Button";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast, renderErrorTxToast } from "@components/TxToast";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { PositionQuery } from "@frankencoin/api";
import { ADDRESS, PositionV1ABI, PositionV2ABI } from "@frankencoin/zchf";

export default function PositionAdjust() {
	const [isApproving, setApproving] = useState(false);
	const [isAdjusting, setAdjusting] = useState(false);

	const [challengeSize, setChallengeSize] = useState(0n);

	const [userCollAllowance, setUserCollAllowance] = useState(0n);
	const [userCollBalance, setUserCollBalance] = useState(0n);
	const [userFrankBalance, setUserFrankBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const account = useAccount();
	const router = useRouter();

	const chainId = useChainId();
	const addressQuery: Address = router.query.address as Address;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == addressQuery) as PositionQuery;
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const [amount, setAmount] = useState<bigint>(BigInt(position.minted || 0n));
	const [collateralAmount, setCollateralAmount] = useState<bigint>(BigInt(position.collateralBalance));
	const [liqPrice, setLiqPrice] = useState<bigint>(BigInt(position?.price ?? 0n));

	// ---------------------------------------------------------------------------
	useEffect(() => {
		const acc: Address | undefined = account.address;
		const fc: Address = ADDRESS[WAGMI_CHAIN.id].frankenCoin;
		if (!position || !position.collateral) return;

		const fetchAsync = async function () {
			if (acc !== undefined) {
				const _balanceFrank = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[WAGMI_CHAIN.id].frankenCoin,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [acc],
				});
				setUserFrankBalance(_balanceFrank);

				const _balanceColl = await readContract(WAGMI_CONFIG, {
					address: position.collateral,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [acc],
				});
				setUserCollBalance(_balanceColl);

				const _allowanceColl = await readContract(WAGMI_CONFIG, {
					address: position.collateral,
					abi: erc20Abi,
					functionName: "allowance",
					args: [acc, position.position],
				});
				setUserCollAllowance(_allowanceColl);
			}

			const _balanceChallenge = await readContract(WAGMI_CONFIG, {
				address: position.position,
				abi: position.version === 1 ? PositionV1ABI : PositionV2ABI,
				functionName: "challengedAmount",
			});
			setChallengeSize(_balanceChallenge);
		};

		fetchAsync();
	}, [data, account.address, position]);

	// ---------------------------------------------------------------------------
	if (!position) return null;

	const isCooldown: boolean = position.cooldown * 1000 - Date.now() > 0;

	const price: number = parseFloat(formatUnits(BigInt(position.price), 36 - position.collateralDecimals));
	const collateralPriceZchf: number = prices[position.collateral.toLowerCase() as Address].price.chf || 1;
	const interest: number = position.annualInterestPPM / 10 ** 6;
	const reserve: number = position.reserveContribution / 10 ** 6;
	const effectiveLTV: number = (price * (1 - reserve)) / collateralPriceZchf;
	const effectiveInterest: number = interest / (1 - reserve);

	const maxMintableForCollateralAmount: bigint = BigInt(formatUnits(BigInt(position.price) * collateralAmount, 36 - 18).split(".")[0]);
	const maxMintableInclClones: bigint = BigInt(position.availableForClones) + BigInt(position.minted);
	const maxTotalLimit: bigint =
		maxMintableForCollateralAmount <= maxMintableInclClones ? maxMintableForCollateralAmount : maxMintableInclClones;

	const calcDirection = amount > BigInt(position.minted);
	const feeDuration = BigInt(Math.floor(position.expiration * 1000 - Date.now())) / 1000n;
	const feePercent = (feeDuration * BigInt(position.annualInterestPPM)) / BigInt(60 * 60 * 24 * 365);
	const fees = calcDirection ? (feePercent * amount) / 1_000_000n : 0n;

	// ---------------------------------------------------------------------------
	const paidOutAmount = () => {
		if (amount > BigInt(position.minted)) {
			return (
				((amount - BigInt(position.minted)) * (1_000_000n - BigInt(position.reserveContribution) - BigInt(feePercent))) / 1_000_000n
			);
		} else {
			return amount - BigInt(position.minted) - returnFromReserve();
		}
	};

	const returnFromReserve = () => {
		return (BigInt(position.reserveContribution) * (amount - BigInt(position.minted))) / 1_000_000n;
	};

	const collateralNote =
		collateralAmount < BigInt(position.collateralBalance)
			? `${formatUnits(abs(collateralAmount - BigInt(position.collateralBalance)), position.collateralDecimals)} ${
					position.collateralSymbol
			  } sent back to your wallet`
			: collateralAmount > BigInt(position.collateralBalance)
			? `${formatUnits(abs(collateralAmount - BigInt(position.collateralBalance)), position.collateralDecimals)} ${
					position.collateralSymbol
			  } taken from your wallet`
			: "";

	const onChangeAmount = (value: string) => {
		setAmount(BigInt(value));
	};

	const onChangeCollAmount = (value: string) => {
		setCollateralAmount(BigInt(value));
	};

	function getCollateralError() {
		if (collateralAmount - BigInt(position.collateralBalance) > userCollBalance) {
			return `Insufficient ${position.collateralSymbol} in your wallet.`;
		} else if (liqPrice * collateralAmount < amount * 10n ** 18n) {
			return "Not enough collateral for the given price and mint amount.";
		}
	}

	function getAmountError() {
		if (isCooldown) {
			return `This position is ${position.cooldown > 1e30 ? "closed" : "in cooldown, please wait"}`;
		} else if (amount - BigInt(position.minted) > maxTotalLimit) {
			return `This position is limited to ${formatCurrency(formatUnits(maxTotalLimit, 18), 2, 2)} ZCHF`;
		} else if (-paidOutAmount() > userFrankBalance) {
			return "Insufficient ZCHF in wallet";
		} else if (liqPrice * collateralAmount < amount * 10n ** 18n) {
			return `Can mint at most ${formatUnits((collateralAmount * liqPrice) / 10n ** 36n, 0)} ZCHF given price and collateral.`;
		} else if (BigInt(position.price) * collateralAmount < amount * 10n ** 18n) {
			return "Amount can only be increased after new price has gone through cooldown.";
		} else {
			return "";
		}
	}

	const onChangeLiqAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setLiqPrice(valueBigInt);
	};

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.collateral as Address,
				abi: erc20Abi,
				functionName: "approve",
				args: [position.position, maxUint256],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: "infinite " + position.collateralSymbol,
				},
				{
					title: "Spender: ",
					value: shortenAddress(position.position),
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

	const handleAdjust = async () => {
		try {
			setAdjusting(true);
			const adjustWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.position,
				abi: PositionV1ABI,
				functionName: "adjust",
				args: [amount, collateralAmount, liqPrice],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount),
				},
				{
					title: "Collateral Amount:",
					value: formatBigInt(collateralAmount, position.collateralDecimals),
				},
				{
					title: "Liquidation Price:",
					value: formatBigInt(liqPrice, 36 - position.collateralDecimals),
				},
				{
					title: "Transaction:",
					hash: adjustWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: adjustWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Adjusting Position`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Adjusted Position" rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAdjusting(false);
		}
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Manage Position</title>
			</Head>

			<div className="md:mt-8">
				<span className="font-bold text-xl">Manage Position at {shortenAddress(position.position)}</span>
			</div>

			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center">Adjustment</div>
						<div className="space-y-8">
							<TokenInput
								label="Amount"
								symbol="ZCHF"
								output={position.closed ? "0" : ""}
								balanceLabel="Max:"
								max={maxTotalLimit}
								digit={18}
								value={amount.toString()}
								onChange={onChangeAmount}
								error={getAmountError()}
								placeholder="Loan Amount"
							/>
							<TokenInput
								label="Collateral"
								balanceLabel="Max:"
								symbol={position.collateralSymbol}
								max={userCollBalance + BigInt(position.collateralBalance)}
								value={collateralAmount.toString()}
								onChange={onChangeCollAmount}
								digit={position.collateralDecimals}
								note={collateralNote}
								error={getCollateralError()}
								placeholder="Collateral Amount"
							/>
							<TokenInput
								label="Liquidation Price"
								balanceLabel="Current Value"
								symbol={"ZCHF"}
								max={BigInt(position.price)}
								value={liqPrice.toString()}
								digit={36 - position.collateralDecimals}
								onChange={onChangeLiqAmount}
								placeholder="Liquidation Price"
							/>
							<div className="mx-auto mt-8 w-72 max-w-full flex-col">
								<GuardToAllowedChainBtn>
									{collateralAmount - BigInt(position.collateralBalance) > userCollAllowance ? (
										<Button isLoading={isApproving} onClick={() => handleApprove()}>
											Approve Collateral
										</Button>
									) : (
										<Button
											disabled={
												(amount == BigInt(position.minted) &&
													collateralAmount == BigInt(position.collateralBalance) &&
													liqPrice == BigInt(position.price)) ||
												(!position.denied &&
													((isCooldown && amount > 0n) || !!getAmountError() || !!getCollateralError())) ||
												(challengeSize > 0n && collateralAmount < BigInt(position.collateralBalance))
											}
											error={position.owner != account.address ? "You can only adjust your own position" : ""}
											isLoading={isAdjusting}
											onClick={() => handleAdjust()}
										>
											Adjust Position
										</Button>
									)}
								</GuardToAllowedChainBtn>
							</div>
						</div>
					</div>
					<div>
						<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col">
							<div className="text-lg font-bold text-center mt-3">Outcome</div>
							<div className="flex-1 mt-4">
								<div className="flex">
									<div className="flex-1"></div>
									<div className="text-right">
										<span className="text-xs mr-3"></span>
									</div>
								</div>

								<div className="flex">
									<div className="flex-1">
										<span>Current minted amount</span>
									</div>
									<div className="text-right">
										{/* <span className="text-xs mr-3">{formatCurrency(0)}%</span> */}
										{formatCurrency(formatUnits(BigInt(position.minted), 18))} ZCHF
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">
										{amount >= BigInt(position.minted) ? "Sent to your wallet" : "To be added from your wallet"}
									</div>
									<div className="text-right">
										{/* <span className="text-xs mr-3">{formatCurrency(0)}%</span> */}
										{formatCurrency(formatUnits(paidOutAmount(), 18))} ZCHF
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">
										{amount >= BigInt(position.minted) ? "Added to reserve on your behalf" : "Returned from reserve"}
									</div>
									<div className="text-right">
										{/* <span className="text-xs mr-3">{formatCurrency(0)}%</span> */}
										{formatCurrency(formatUnits(returnFromReserve(), 18))} ZCHF
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">
										<span>Upfront interest</span>
										<div className="text-xs">({position.annualInterestPPM / 10000}% per year)</div>
									</div>
									<div className="text-right">
										{/* <span className="text-xs mr-3">{formatCurrency(0)}%</span> */}
										{formatCurrency(formatUnits(fees, 18))} ZCHF
									</div>
								</div>

								<hr className="mt-4 border-slate-700 border-dashed" />

								<div className="mt-2 flex font-bold">
									<div className="flex-1">
										<span>Future minted amount</span>
									</div>
									<div className="text-right">
										{/* <span className="text-xs mr-3">100%</span> */}
										<span>{formatCurrency(formatUnits(amount, 18))} ZCHF</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}
