import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { formatUnits, maxUint256, erc20Abi, Address, parseEther, parseUnits } from "viem";
import Head from "next/head";
import TokenInput from "@components/Input/TokenInput";
import { abs, bigIntMax, bigIntMin, ContractUrl, formatBigInt, formatCurrency, formatDuration, shortenAddress } from "@utils";
import Button from "@components/Button";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { TxToast, renderErrorTxToast, renderErrorTxToastDecode } from "@components/TxToast";
import { WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { PositionQuery } from "@frankencoin/api";
import { ADDRESS, PositionV1ABI, PositionV2ABI } from "@frankencoin/zchf";
import AppTitle from "@components/AppTitle";
import PositionRollerTable from "@components/PageMypositions/PositionRollerTable";
import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import MyPositionsNotFound from "@components/PageMypositions/MyPositionsNotFound";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";

export default function PositionAdjust() {
	const [isApproving, setApproving] = useState(false);
	const [isAdjusting, setAdjusting] = useState(false);

	const [challengeSize, setChallengeSize] = useState(0n);

	const [userCollAllowance, setUserCollAllowance] = useState(0n);
	const [userCollBalance, setUserCollBalance] = useState(0n);
	const [userFrancBalance, setUserFrancBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const account = useAccount();
	const router = useRouter();
	const chainId = mainnet.id;

	const addressQuery: Address = router.query.address as Address;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == addressQuery) as PositionQuery;

	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const [amount, setAmount] = useState<bigint>(BigInt(position?.minted ?? 0n));
	const [collateralAmount, setCollateralAmount] = useState<bigint>(BigInt(position?.collateralBalance ?? 0n));
	const [liqPrice, setLiqPrice] = useState<bigint>(BigInt(position?.price ?? 0n));

	// ---------------------------------------------------------------------------

	useEffect(() => {
		if (position != undefined && amount == 0n && collateralAmount == 0n && liqPrice == 0n) {
			setAmount(BigInt(position.minted));
			setCollateralAmount(BigInt(position.collateralBalance));
			setLiqPrice(BigInt(position.price));
		}
	}, [position, amount, collateralAmount, liqPrice]);

	useEffect(() => {
		const acc: Address | undefined = account.address;
		const fc: Address = ADDRESS[mainnet.id].frankencoin;
		if (!position || !position.collateral) return;

		const fetchAsync = async function () {
			if (acc !== undefined) {
				const _balanceFranc = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[mainnet.id].frankencoin,
					chainId,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [acc],
				});
				setUserFrancBalance(_balanceFranc);

				const _balanceColl = await readContract(WAGMI_CONFIG, {
					address: position.collateral,
					chainId,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [acc],
				});
				setUserCollBalance(_balanceColl);

				const _allowanceColl = await readContract(WAGMI_CONFIG, {
					address: position.collateral,
					chainId,
					abi: erc20Abi,
					functionName: "allowance",
					args: [acc, position.position],
				});
				setUserCollAllowance(_allowanceColl);
			}

			const _balanceChallenge = await readContract(WAGMI_CONFIG, {
				address: position.position,
				chainId,
				abi: position.version === 1 ? PositionV1ABI : PositionV2ABI,
				functionName: "challengedAmount",
			});
			setChallengeSize(_balanceChallenge);
		};

		fetchAsync();
	}, [data, account.address, position, chainId]);

	// ---------------------------------------------------------------------------
	if (!position) return <MyPositionsNotFound query={addressQuery} />;

	const priceQuery = prices[position.collateral.toLowerCase() as Address];
	if (!priceQuery) return <AppCard>Market Price of position not found</AppCard>;

	const marketPriceDec = priceQuery.price.chf != undefined ? Math.round(priceQuery.price.chf * 80) / 100 : 1;
	const marketPrice80Pct = parseUnits(String(marketPriceDec), 36 - position.collateralDecimals);

	const isCooldown: boolean = position.cooldown * 1000 - Date.now() > 0;

	let maxMintableInclClones: bigint = 0n;

	if (position.version == 1) {
		maxMintableInclClones = BigInt(position.availableForClones) + BigInt(position.minted);
	} else if (position.version == 2) {
		maxMintableInclClones = BigInt(position.availableForMinting) + BigInt(position.minted);
	}

	// @dev: deactivated limitation for collateral balance
	//const maxMintableForCollateralAmount: bigint = BigInt(formatUnits(BigInt(position.price) * collateralAmount, 36 - 18).split(".")[0]);
	// const maxTotalLimit: bigint = bigIntMin(maxMintableForCollateralAmount, maxMintableInclClones);
	const maxTotalLimit: bigint = maxMintableInclClones;

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
		if (liqPrice > BigInt(position.price) && BigInt(position.price) * collateralAmount < amount * parseEther("1")) {
			return "This position is limited to the old price, add some collateral.";
		} else if (liqPrice * collateralAmount < amount * 10n ** 18n) {
			return "Not enough collateral for the given price and mint amount.";
		} else if (collateralAmount - BigInt(position.collateralBalance) > userCollBalance) {
			return `Insufficient ${position.collateralSymbol} in your wallet.`;
		}
	}

	function getAmountError() {
		if (isCooldown) {
			return `This position is ${position.cooldown > 1e30 ? "closed" : "in cooldown, please wait"}`;
		} else if (amount > maxTotalLimit) {
			return `This position is limited to ${formatCurrency(formatUnits(maxTotalLimit, 18), 2, 2)} ZCHF`;
		} else if (liqPrice * collateralAmount < amount * 10n ** 18n) {
			return `Can mint at most ${formatUnits((collateralAmount * liqPrice) / 10n ** 36n, 0)} ZCHF given price and collateral.`;
		} else if (amount > BigInt(position.minted) && liqPrice > BigInt(position.price)) {
			return "Amount can only be increased after new price has gone through cooldown.";
		} else if (liqPrice > BigInt(position.price) && BigInt(position.price) * collateralAmount < amount * parseEther("1")) {
			return "This position is limited to the old price, decrease the mint.";
		} else if (userFrancBalance + paidOutAmount() < 0) {
			return "Insufficient ZCHF in wallet";
		} else {
			return "";
		}
	}

	const onChangeLiqAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		const isHigher = valueBigInt > BigInt(position.price);
		setLiqPrice(valueBigInt);
	};

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.collateral as Address,
				chainId,
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
				chainId,
				abi: position.version == 2 ? PositionV2ABI : PositionV1ABI,
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
			toast.error(renderErrorTxToastDecode(error, position.version == 2 ? PositionV2ABI : PositionV1ABI, 2));
		} finally {
			setAdjusting(false);
		}
	};

	const calcDirection = amount > BigInt(position.minted);
	const feeDuration = BigInt(Math.floor(position.expiration * 1000 - Date.now())) / 1000n;
	const feePercent = (feeDuration * BigInt(position.annualInterestPPM)) / BigInt(60 * 60 * 24 * 365);
	const fees = calcDirection ? amount - BigInt(position.minted) - returnFromReserve() - paidOutAmount() : 0n;

	const isMinted = BigInt(position.minted) > 0n;

	const walletRatio = isMinted
		? (paidOutAmount() * parseEther("1")) / BigInt(position.minted)
		: amount > 0n
		? (paidOutAmount() * parseEther("1")) / amount
		: 0n;
	const reserveRatio = isMinted
		? (returnFromReserve() * parseEther("1")) / BigInt(position.minted)
		: amount > 0n
		? (returnFromReserve() * parseEther("1")) / amount
		: 0n;
	const feeRatio = isMinted ? (fees * parseEther("1")) / BigInt(position.minted) : amount > 0n ? (fees * parseEther("1")) / amount : 0n;
	const futureRatio = isMinted ? (amount * parseEther("1")) / BigInt(position.minted) : amount > 0n ? parseEther("1") : parseEther("0");

	const expirationDateArr: string[] = new Date(position.expiration * 1000).toDateString().split(" ");
	const expirationDateStr: string = `${expirationDateArr[2]} ${expirationDateArr[1]} ${expirationDateArr[3]}`;
	const expirationDiff: number = Math.round((position.expiration * 1000 - Date.now()) / 1000);
	const expiredIn: string = expirationDiff > 0 ? formatDuration(expirationDiff) : "Expired";

	// Minted Min
	const mintedMin = bigIntMax(
		0n,
		BigInt(position.minted) - (userFrancBalance * 1000000n) / (1000000n - BigInt(position.reserveContribution))
	);

	const mintedMinCallback = () => {
		/* Disabled: I think the user should click min separately on the collateral field if he also wants to have the collateral returned
		const p = liqPrice;
		const calcCollateral = (mintedMin * parseEther("1")) / p;
		const verifyMint = (calcCollateral * p) / parseEther("1");
		const isRoundingError = verifyMint < mintedMin;
		const correctedCollateral = isRoundingError ? calcCollateral + 1n : calcCollateral;
		setCollateralAmount(correctedCollateral);
		return correctedCollateral; */
	};

	// Minted Max
	const mintedMax = bigIntMin(maxTotalLimit, (liqPrice * (BigInt(position.collateralBalance) + userCollBalance)) / parseEther("1"));

	const mintedMaxCallback = () => {
		/* Disabled: I think the user should click max separately on the collateral field if he also wants to have the collateral returned
		const p = liqPrice;
		if (p > 0){
			const calcCollateral = (mintedMax * parseEther("1")) / p;
			const verifyMint = (calcCollateral * p) / parseEther("1");
			const isRoundingError = verifyMint < mintedMax;
			const correctedCollateral = isRoundingError ? calcCollateral + 1n : calcCollateral;
			setCollateralAmount(correctedCollateral);
		} */
	};

	// Collateral Min
	const collateralMinCallback = () => {
		const p = liqPrice;
		if (p > 0) {
			const calcCollateral = (amount * parseEther("1")) / p;
			const verifyMint = (calcCollateral * p) / parseEther("1");
			const isRoundingError = verifyMint < amount;
			const correctedCollateral = isRoundingError ? calcCollateral + 1n : calcCollateral;
			setCollateralAmount(correctedCollateral);
		}
	};

	// LiqPrice
	const liqPriceMinCallback = () => {
		if (collateralAmount > 0) {
			const calcPrice = (amount * parseEther("1")) / collateralAmount;
			const verifyMint = (calcPrice * collateralAmount) / parseEther("1");
			const isRoundingError = verifyMint < amount;
			const corrected = isRoundingError ? calcPrice + 1n : calcPrice;
			setLiqPrice(corrected);
		}
	};

	const liqPriceMaxCallback = () => {
		// const calcPrice = (amount * parseEther("1")) / (BigInt(position.collateralBalance) + userCollBalance);
		// const verifyMint = (calcPrice * collateralAmount) / parseEther("1");
		// const isRoundingError = verifyMint < amount;
		// const corrected = isRoundingError ? calcPrice + 1n : calcPrice;
		// setLiqPrice(corrected);
		// setCollateralAmount(BigInt(position.collateralBalance) + userCollBalance);
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Manage Position</title>
			</Head>

			<AppTitle title={`Manage Position `}>
				<div className="text-text-secondary">
					Based on contract{" "}
					<AppLink
						label={shortenAddress(position.position) + "."}
						href={ContractUrl(position.position)}
						external={true}
						className="pr-1"
					/>
				</div>
			</AppTitle>

			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center">Adjustment</div>
						<div className="space-y-8">
							<TokenInput
								label="Amount"
								symbol="ZCHF"
								output={position.closed ? "0" : ""}
								min={mintedMin}
								max={mintedMax}
								reset={BigInt(position.minted)}
								digit={18}
								value={amount.toString()}
								onChange={onChangeAmount}
								onMin={mintedMinCallback}
								onMax={mintedMaxCallback}
								error={getAmountError()}
								placeholder="Loan Amount"
								limit={userFrancBalance}
								limitDigit={18}
								limitLabel="Balance"
							/>
							<TokenInput
								label="Collateral"
								symbol={position.collateralSymbol}
								min={BigInt("0")}
								max={userCollBalance + BigInt(position.collateralBalance)}
								reset={BigInt(position.collateralBalance)}
								value={collateralAmount.toString()}
								onChange={onChangeCollAmount}
								onMin={collateralMinCallback}
								digit={position.collateralDecimals}
								note={collateralNote}
								error={getCollateralError()}
								placeholder="Collateral Amount"
								limit={userCollBalance}
								limitDigit={position.collateralDecimals}
								limitLabel="Balance"
							/>
							<TokenInput
								label="Liquidation Price"
								symbol={"ZCHF"}
								min={collateralAmount == 0n ? 0n : (amount * 10n ** 18n) / collateralAmount}
								max={marketPrice80Pct}
								reset={BigInt(position.price)}
								value={liqPrice.toString()}
								digit={36 - position.collateralDecimals}
								onChange={onChangeLiqAmount}
								onMin={liqPriceMinCallback}
								onMax={liqPriceMaxCallback}
								placeholder="Liquidation Price"
							/>

							<div className="flex-1 mt-4">
								<div className="flex">
									<div className="flex-1 text-text-secondary">
										<span>Maturity</span>
									</div>
									<div className="text-right">{expirationDateStr}</div>
								</div>
								<div className="flex mt-2">
									<div className="flex-1 text-text-secondary">
										<span>Expiration</span>
									</div>
									<div className="text-right">{expiredIn}</div>
								</div>
							</div>

							<div className="mx-auto mt-8 w-72 max-w-full flex-col">
								<GuardSupportedChain chain={mainnet}>
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
											isLoading={isAdjusting}
											onClick={() => handleAdjust()}
										>
											Adjust Position
										</Button>
									)}
								</GuardSupportedChain>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<AppCard>
							<div className="text-lg font-bold text-center mt-3">Connected Wallet</div>
							<div className="flex-1 mt-4">
								<div className="flex">
									<div className="flex-1 text-text-secondary">
										<span>Frankencoin Balance</span>
									</div>
									<div className="text-right">{formatCurrency(formatUnits(userFrancBalance, 18))} ZCHF</div>
								</div>
								<div className="flex mt-2">
									<div className="flex-1 text-text-secondary">
										<span>Collateral Balance</span>
									</div>
									<div className="text-right">
										{formatCurrency(formatUnits(userCollBalance, position.collateralDecimals))}{" "}
										{position.collateralSymbol}
									</div>
								</div>
							</div>
						</AppCard>

						<AppCard>
							<div className="text-lg font-bold text-center mt-3">Adjustment Outcome</div>
							<div className="flex-1 mt-4">
								<div className="flex">
									<div className="flex-1 text-text-secondary">
										<span>Current minted amount</span>
									</div>
									<div className="text-right">
										<span className="text-xs mr-3">{isMinted ? "100.00%" : "0.00%"}</span>
										{formatCurrency(formatUnits(BigInt(position.minted), 18))} ZCHF
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1 text-text-secondary">
										{amount >= BigInt(position.minted) ? "Sent to your wallet" : "To be added from your wallet"}
									</div>
									<div className="text-right">
										<span className="text-xs mr-3">{formatCurrency(formatUnits(walletRatio, 16))}%</span>
										{formatCurrency(formatUnits(paidOutAmount(), 18))} ZCHF
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1 text-text-secondary">
										{amount >= BigInt(position.minted) ? "Added to reserve on your behalf" : "Returned from reserve"}
									</div>
									<div className="text-right">
										<span className="text-xs mr-3">{formatCurrency(formatUnits(reserveRatio, 16))}%</span>
										{formatCurrency(formatUnits(returnFromReserve(), 18))} ZCHF
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1 text-text-secondary">
										<span>Upfront interest</span>
										<div className="text-xs">({position.annualInterestPPM / 10000}% per year)</div>
									</div>
									<div className="text-right">
										<span className="text-xs mr-3">{formatCurrency(formatUnits(feeRatio, 16))}%</span>
										{formatCurrency(formatUnits(fees, 18))} ZCHF
									</div>
								</div>

								<hr className="mt-4 border-text-primary border-dashed" />

								<div className="mt-2 flex font-extrabold">
									<div className="flex-1 text-text-secondary">
										<span>Future minted amount</span>
									</div>
									<div className="text-right">
										<span className="text-xs mr-3">{formatCurrency(formatUnits(futureRatio, 16))}%</span>
										<span>{formatCurrency(formatUnits(amount, 18))} ZCHF</span>
									</div>
								</div>
							</div>
						</AppCard>
					</div>
				</section>
			</div>

			{position.version == 1 || position.minted == "0" ? (
				<></>
			) : (
				<>
					<AppTitle title={`Renewal`}>
						<div className="text-text-secondary">
							You can renew positions by rolling them into suitable new ones with the same collateral. When rolling, the owed
							amount will be increased by the up-front interest for the new position and any excess collateral paid out to
							your address. If you want to reduce the outstanding amount, you should do that before rolling.
						</div>
					</AppTitle>

					<div className="mt-8">
						<PositionRollerTable position={position} challengeSize={challengeSize} />
					</div>
				</>
			)}
		</>
	);
}
