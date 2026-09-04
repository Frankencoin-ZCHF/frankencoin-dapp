import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatUnits, maxUint256, erc20Abi, Address, parseEther, parseUnits } from "viem";
import Head from "next/head";
import TokenInput from "@components/Input/TokenInput";
import {
	abs,
	bigIntMax,
	bigIntMin,
	ContractUrl,
	formatBigInt,
	formatCurrency,
	formatDuration,
	normalizeAddress,
	shortenAddress,
} from "@utils";
import AppButton from "@components/AppButton";
import { useConnection, useBlockNumber, useChainId } from "wagmi";
import { readContract, simulateContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { TxToast, renderErrorTxToast, renderErrorTxToastDecode } from "@components/TxToast";
import { WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { isSameSnapshot, PositionLiveSnapshot, snapshotOf, usePositionLive } from "@hooks";
import { ADDRESS, PositionV1ABI, PositionV2ABI } from "@frankencoin/zchf";
import AppTitle from "@components/AppTitle";
import PositionRollerTable from "@components/PageMypositions/PositionRollerTable";
import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import MyPositionsNotFound from "@components/PageMypositions/MyPositionsNotFound";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { generateExpirationCalendar, downloadCalendarFile, generateGoogleCalendarUrl } from "../../../utils/calendarGenerator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faCalendarPlus } from "@fortawesome/free-solid-svg-icons";

export default function PositionAdjust() {
	const [isApproving, setApproving] = useState(false);
	const [isAdjusting, setAdjusting] = useState(false);

	const [userCollAllowance, setUserCollAllowance] = useState(0n);
	const [userCollBalance, setUserCollBalance] = useState(0n);
	const [userFrancBalance, setUserFrancBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const account = useConnection();
	const router = useRouter();
	const chainId = mainnet.id;

	const addressQuery: Address = router.query.address as Address;

	// the indexed record is only used for discovery and static fields; everything that feeds the transaction is read live
	const positions = useSelector((state: RootState) => state.positions.list.list);
	const indexedPosition = positions.find((p) => p.position == addressQuery);
	const { position: livePosition, live, isLive, error: liveError, refetch: refetchLive } = usePositionLive(indexedPosition);
	const challengeSize = live?.challengedAmount ?? 0n;

	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const [amount, setAmount] = useState<bigint>(0n);
	const [collateralAmount, setCollateralAmount] = useState<bigint>(0n);
	const [liqPrice, setLiqPrice] = useState<bigint>(0n);

	// the on-chain state the inputs were derived from, and whether the user has edited them since
	const [seed, setSeed] = useState<PositionLiveSnapshot>();
	const [isDirty, setDirty] = useState(false);

	// ---------------------------------------------------------------------------

	const seedForm = useCallback((snapshot: PositionLiveSnapshot) => {
		setAmount(snapshot.minted);
		setCollateralAmount(snapshot.collateralBalance);
		setLiqPrice(snapshot.price);
		setSeed(snapshot);
		setDirty(false);
	}, []);

	const currentSnapshot = useMemo(() => (livePosition ? snapshotOf(livePosition) : undefined), [livePosition]);
	const hasDrift = seed !== undefined && currentSnapshot !== undefined && !isSameSnapshot(seed, currentSnapshot);

	// start over when navigating to another position
	useEffect(() => {
		setSeed(undefined);
		setDirty(false);
	}, [addressQuery]);

	// seed the inputs from the position and follow the chain as long as the user has not edited them
	useEffect(() => {
		if (!currentSnapshot) return;
		if (seed === undefined || (hasDrift && !isDirty)) seedForm(currentSnapshot);
	}, [currentSnapshot, seed, hasDrift, isDirty, seedForm]);

	const collateralAddress = livePosition?.collateral;
	const positionAddress = livePosition?.position;

	useEffect(() => {
		const acc: Address | undefined = account.address;
		if (acc === undefined || !collateralAddress || !positionAddress) return;

		const fetchAsync = async function () {
			const _balanceFranc = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[mainnet.id].frankencoin,
				chainId,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [acc],
			});
			setUserFrancBalance(_balanceFranc);

			const _balanceColl = await readContract(WAGMI_CONFIG, {
				address: collateralAddress,
				chainId,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [acc],
			});
			setUserCollBalance(_balanceColl);

			const _allowanceColl = await readContract(WAGMI_CONFIG, {
				address: collateralAddress,
				chainId,
				abi: erc20Abi,
				functionName: "allowance",
				args: [acc, positionAddress],
			});
			setUserCollAllowance(_allowanceColl);
		};

		fetchAsync();
	}, [data, account.address, collateralAddress, positionAddress, chainId]);

	// ---------------------------------------------------------------------------
	if (!livePosition) return <MyPositionsNotFound query={addressQuery} />;
	const position = livePosition;

	const priceQuery = prices[normalizeAddress(position.collateral)];
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
		setDirty(true);
		setAmount(BigInt(value));
	};

	const onChangeCollAmount = (value: string) => {
		setDirty(true);
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
		} else if (liqPrice > BigInt(position.price) && BigInt(position.price) * collateralAmount < amount * parseEther("1")) {
			return "This position is limited to the old price, decrease the mint.";
		} else if (userFrancBalance + paidOutAmount() < 0) {
			return "Insufficient ZCHF in wallet";
		} else {
			return "";
		}
	}

	const onChangeLiqAmount = (value: string) => {
		setDirty(true);
		setLiqPrice(BigInt(value));
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

			// adjust() takes absolute targets, so never sign against state that is not what the chain holds right now
			const fresh = await refetchLive();
			if (!fresh) {
				toast.error("Could not read the current on-chain state of the position. Please try again.");
				return;
			}
			if (!isSameSnapshot(seed, snapshotOf(fresh))) {
				seedForm(snapshotOf(fresh));
				toast.error(
					"The position changed on-chain since you loaded this form. The values have been refreshed, please review them and try again."
				);
				return;
			}

			const abi = position.version == 2 ? PositionV2ABI : PositionV1ABI;
			await simulateContract(WAGMI_CONFIG, {
				address: position.position,
				chainId,
				abi,
				functionName: "adjust",
				args: [amount, collateralAmount, liqPrice],
				account: account.address,
			});

			const adjustWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.position,
				chainId,
				abi,
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

	const annualInterest = position.annualInterestPPM / 10_000;

	const calcDirection = amount > BigInt(position.minted);
	const feeDuration = BigInt(Math.floor(position.expiration * 1000 - Date.now())) / 1000n;
	const feePercent = (feeDuration * BigInt(position.annualInterestPPM)) / BigInt(60 * 60 * 24 * 365);
	const fees = calcDirection ? amount - BigInt(position.minted) - returnFromReserve() - paidOutAmount() : 0n;

	const isMinted = BigInt(position.minted) > 0n;

	const diffMint = amount - BigInt(position.minted);

	const walletRatio = diffMint != 0n ? (paidOutAmount() * parseEther("1")) / diffMint : 0n;
	const reserveRatio = diffMint != 0n ? (returnFromReserve() * parseEther("1")) / diffMint : 0n;
	const feeRatio = diffMint != 0n ? (fees * parseEther("1")) / diffMint : 0n;
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
	const bindingPrice = bigIntMin(liqPrice, BigInt(position.price));
	const mintedMax = bigIntMin(maxTotalLimit, (bindingPrice * collateralAmount) / parseEther("1"));

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
	const liqPriceMaxCallback = () => {
		// const calcPrice = (amount * parseEther("1")) / (BigInt(position.collateralBalance) + userCollBalance);
		// const verifyMint = (calcPrice * collateralAmount) / parseEther("1");
		// const isRoundingError = verifyMint < amount;
		// const corrected = isRoundingError ? calcPrice + 1n : calcPrice;
		// setLiqPrice(corrected);
		// setCollateralAmount(BigInt(position.collateralBalance) + userCollBalance);
	};

	const handleDownloadCalendar = () => {
		const calendarContent = generateExpirationCalendar([position], account.address ?? "");
		downloadCalendarFile(calendarContent, `frankencoin-position-${position.position.slice(0, 8)}.ics`);
	};

	const handleGoogleCalendar = () => {
		const googleUrl = generateGoogleCalendarUrl(position);
		window.open(googleUrl, "_blank");
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Manage Position</title>
			</Head>

			<AppTitle
				title={`${position.collateralName} (${position.collateralSymbol})`}
				subtitle={`Manage your position.`}
				badges={[
					position.closed
						? { label: "Closed", className: "bg-red-500/20 text-red-400" }
						: isCooldown
						? { label: "Cooldown", className: "bg-amber-500/20 text-amber-400" }
						: { label: "Active", className: "bg-green-500/20 text-green-400" },
					{ label: `V${position.version}`, className: "bg-blue-500/20 text-blue-400" },
					...(position.isClone ? [{ label: "Clone", className: "bg-purple-500/20 text-purple-400" }] : []),
				]}
				actions={
					<div className="flex flex-wrap gap-4 text-sm">
						<AppLink label="Details" href={`/monitoring/${position.position}`} external={false} />
						<AppLink label="Contract" href={ContractUrl(position.position)} external={true} />
					</div>
				}
			/>

			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<AppCard>
						<div className="text-lg font-bold text-center">Adjustment</div>
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
							min={collateralAmount == 0n ? 0n : (amount * 10n ** 18n + collateralAmount - 1n) / collateralAmount}
							max={marketPrice80Pct}
							reset={BigInt(position.price)}
							value={liqPrice.toString()}
							digit={36 - position.collateralDecimals}
							onChange={onChangeLiqAmount}
							onMax={liqPriceMaxCallback}
							placeholder="Liquidation Price"
						/>

						{liveError && !isLive && (
							<div className="rounded-lg bg-amber-500/20 text-amber-400 text-sm px-3 py-2 mb-2">
								Could not read the live on-chain state of this position. The values shown come from the indexer and may be
								outdated.
							</div>
						)}
						{hasDrift && isDirty && (
							<div className="rounded-lg bg-amber-500/20 text-amber-400 text-sm px-3 py-2 mb-2 flex items-center gap-3">
								<span className="flex-1">The position changed on-chain since you started editing.</span>
								<button className="underline" onClick={() => currentSnapshot && seedForm(currentSnapshot)}>
									Reload values
								</button>
							</div>
						)}

						<GuardSupportedChain chain={mainnet}>
							{collateralAmount - BigInt(position.collateralBalance) > userCollAllowance ? (
								<AppButton isLoading={isApproving} onClick={() => handleApprove()}>
									Approve Collateral
								</AppButton>
							) : (
								<AppButton
									disabled={
										hasDrift ||
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
								</AppButton>
							)}
						</GuardSupportedChain>
					</AppCard>

					<div className="flex flex-col gap-4">
						<AppCard>
							<div className="text-lg font-bold text-center mt-3">Position Details</div>
							<div className="flex-1 mt-4">
								<div className="flex">
									<div className="flex-1 text-text-secondary">
										<span>Annual Interest</span>
									</div>
									<div className="text-right">{annualInterest}%</div>
								</div>
								<div className="flex mt-2">
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
						</AppCard>

						<AppCard>
							<div className="text-lg font-bold text-center mt-3">Adjustment Outcome</div>
							<div className="flex-1 mt-4">
								<div className="flex">
									<div className="flex-1 text-text-secondary">
										<span>Current minted amount</span>
									</div>
									<div className="text-right">{formatCurrency(formatUnits(BigInt(position.minted), 18))} ZCHF</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1 text-text-secondary">
										{amount >= BigInt(position.minted) ? "Sent to your wallet " : "To be added from your wallet "}
										<span className="text-xs mr-3">({formatCurrency(formatUnits(walletRatio, 16))}%)</span>
									</div>
									<div className="text-right">
										{/* <span className="text-xs mr-3">{formatCurrency(formatUnits(walletRatio, 16))}%</span> */}
										{formatCurrency(formatUnits(paidOutAmount(), 18))} ZCHF
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1 text-text-secondary">
										{amount >= BigInt(position.minted) ? "Added to reserve on your behalf " : "Returned from reserve "}
										<span className="text-xs mr-3">({formatCurrency(formatUnits(reserveRatio, 16))}%)</span>
									</div>
									<div className="text-right">
										{/* <span className="text-xs mr-3">{formatCurrency(formatUnits(reserveRatio, 16))}%</span> */}
										{formatCurrency(formatUnits(returnFromReserve(), 18))} ZCHF
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1 text-text-secondary">
										<span>Upfront interest </span>
										{/* <div className="text-xs">({position.annualInterestPPM / 10000}% per year)</div> */}
										<span className="text-xs mr-3">({formatCurrency(formatUnits(feeRatio, 16))}%)</span>
									</div>
									<div className="text-right">{formatCurrency(formatUnits(fees, 18))} ZCHF</div>
								</div>

								<hr className="mt-4 border-text-primary border-dashed" />

								<div className="mt-2 flex font-extrabold">
									<div className="flex-1 text-text-secondary">
										<span>Future minted amount</span>
									</div>
									<div className="text-right">
										{/* <span className="text-xs mr-3">{formatCurrency(formatUnits(futureRatio, 16))}%</span> */}
										<span>{formatCurrency(formatUnits(amount, 18))} ZCHF</span>
									</div>
								</div>
							</div>
						</AppCard>
						{!position.closed && !position.denied && (
							<div className="flex justify-end gap-2">
								<button
									onClick={handleGoogleCalendar}
									className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors"
									title="Add expiration reminder to Google Calendar"
								>
									<FontAwesomeIcon icon={faCalendarPlus} className="mr-2" />
									Add to Google Calendar
								</button>
								<button
									onClick={handleDownloadCalendar}
									className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors"
									title="Download expiration alert calendar for this position"
								>
									<FontAwesomeIcon icon={faCalendarDays} className="mr-2" />
									Download Calendar
								</button>
							</div>
						)}
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
							amount will be increased by the up-front interest for the new position and any excess collateral will be paid
							out to your address. If you want to reduce the outstanding amount, you should do that before rolling.
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
