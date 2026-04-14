import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits, erc20Abi, Address } from "viem";
import TokenInput from "@components/Input/TokenInput";
import ButtonSecondary from "@components/ButtonSecondary";
import Button from "@components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faLinkSlash } from "@fortawesome/free-solid-svg-icons";
import { useAccount, useBlockNumber } from "wagmi";
import { readContract } from "wagmi/actions";
import { formatCurrency, formatDateFromSecs, min, normalizeAddress, shortenAddress, toTimestamp, DISCUSSIONS } from "@utils";
import DateInput from "@components/Input/DateInput";
import { WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { ADDRESS } from "@frankencoin/zchf";
import AppLink from "@components/AppLink";
import { useRouter as useNavigation } from "next/navigation";
import { mainnet } from "viem/chains";
import AppCard from "@components/AppCard";
import AppTitle from "@components/AppTitle";
import LiquidationSlider from "@components/Input/LiquidationSlider";
import { useBorrowPositions } from "../../../hooks/useBorrowPositions";
import BorrowCloneAction from "@components/PageBorrow/BorrowCloneAction";
import BorrowClonePriceAction from "@components/PageBorrow/BorrowClonePriceAction";

function toDate(time: bigint | number | string) {
	return new Date(Number(BigInt(time)) * 1000);
}

export default function PositionBorrow({}) {
	const [amount, setAmount] = useState(0n);
	const [errorDate, setErrorDate] = useState("");
	const [isInit, setInit] = useState<boolean>(false);
	const [expirationDate, setExpirationDate] = useState<Date>(new Date(0));
	const [expirationTab, setExpirationTab] = useState<string>("Max");

	const [collAmount, setCollAmount] = useState(0n);
	const [newPrice, setNewPrice] = useState(0n);
	const [mintPrice, setMintPrice] = useState(0n);

	const [linked, setLinked] = useState(true);

	const [userAllowance, setUserAllowance] = useState(0n);
	const [userAllowanceHelper, setUserAllowanceHelper] = useState(0n);
	const [userBalance, setUserBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const navigate = useNavigation();
	const account = useAccount();
	const router = useRouter();

	const chainId = mainnet.id;
	const addressQuery: Address = router.query.address as Address;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == addressQuery);
	const { bestPriceByCollateral, bestInterestByCollateral, bestExpirationByCollateral, bestAvailabilityByCollateral } =
		useBorrowPositions();
	const originalPosition = position?.isClone ? positions.find((p) => p.position === position.original) : position;
	const originalExpiration = originalPosition?.expiration ?? position?.expiration;

	const prices = useSelector((state: RootState) => state.prices.coingecko);

	useEffect(() => {
		if (isInit) return;
		if (!position || position.expiration == 0) return;
		setExpirationDate(toDate(originalExpiration ?? position.expiration));

		if (!amount) {
			const initColl = BigInt(position.minimumCollateral);
			const initPrice = BigInt(position.price);
			const initMintAmount = (initPrice * initColl) / parseUnits("1", 18);

			setCollAmount(initColl);
			setNewPrice(initPrice);
			setMintPrice(initPrice);
			setAmount(initMintAmount);
		}

		setInit(true);
	}, [position, amount, expirationDate, isInit, originalExpiration]);

	useEffect(() => {
		const acc: Address | undefined = account.address;
		if (acc === undefined) return;
		if (!position || !position.collateral) return;

		const fetchAsync = async function () {
			const _balance = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				chainId,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [acc],
			});
			setUserBalance(_balance);

			const _allowance = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				chainId,
				abi: erc20Abi,
				functionName: "allowance",
				args: [acc, position.version == 1 ? ADDRESS[chainId].mintingHubV1 : ADDRESS[chainId].mintingHubV2],
			});
			setUserAllowance(_allowance);

			if (position.version == 2) {
				const _allowanceHelper = await readContract(WAGMI_CONFIG, {
					address: position.collateral,
					chainId,
					abi: erc20Abi,
					functionName: "allowance",
					args: [acc, ADDRESS[chainId].cloneHelper],
				});
				setUserAllowanceHelper(_allowanceHelper);
			}
		};

		fetchAsync();
	}, [data, account.address, position, chainId]);

	// don't continue if position not loaded correctly
	if (!position) return null;

	const priceBigInt = BigInt(position.price);
	const priceDigit = 36 - position.collateralDecimals;
	const priceFloat = parseFloat(formatUnits(priceBigInt, priceDigit));
	const collateralPriceZchf = prices[normalizeAddress(position.collateral)].price.chf || 1;
	const reserve = position.reserveContribution / 10 ** 6;
	const effectiveLTV = (priceFloat * (1 - reserve)) / collateralPriceZchf;
	const ltvLimit = parseUnits(Math.max(0, (Number(formatUnits(newPrice, priceDigit)) / collateralPriceZchf) * 100).toFixed(6), 6);
	const effectiveInterest = position.annualInterestPPM / 10 ** 6 / (1 - reserve);

	const requiredColl = collAmount > BigInt(position.minimumCollateral) ? collAmount : BigInt(position.minimumCollateral);
	const expirationMax = toDate(originalExpiration ?? position.expiration);
	const _now = new Date();
	const expirationTabDates: Record<string, Date> = {
		"1M": new Date(_now.getFullYear(), _now.getMonth() + 1, _now.getDate()),
		"3M": new Date(_now.getFullYear(), _now.getMonth() + 3, _now.getDate()),
		"6M": new Date(_now.getFullYear(), _now.getMonth() + 6, _now.getDate()),
		"1Y": new Date(_now.getFullYear() + 1, _now.getMonth(), _now.getDate()),
		Max: expirationMax,
	};

	const minColl = BigInt(position.minimumCollateral);
	const errorColl =
		collAmount < minColl
			? `Minimum ${formatCurrency(formatUnits(minColl, position.collateralDecimals))} ${position.collateralSymbol} required`
			: account.address && collAmount > userBalance
			? `Not enough ${position.collateralSymbol} in your wallet.`
			: "";

	const borrowersReserveContribution = (BigInt(position.reserveContribution) * amount) / 1_000_000n;

	// max(4 weeks, chosen expiration - now) * annualInterestPPM / 365 days / 1_000_000
	const feePercent =
		(BigInt(Math.floor((expirationDate.getTime() - Date.now()) / 1000)) * BigInt(position.annualInterestPPM)) /
		BigInt(60 * 60 * 24 * 365);
	const availableAmount = BigInt(position.availableForClones);
	const fees = (feePercent * amount) / 1_000_000n;
	const paidOutToWallet = amount - borrowersReserveContribution - fees;
	const availableByCollateralPrice = (collAmount * mintPrice) / parseUnits("1", 18);
	const borrowingLimit = min(availableAmount, availableByCollateralPrice);
	const mintableAtNewPrice = min((collAmount * newPrice) / parseUnits("1", 18), availableAmount);
	const additionalMintable = mintableAtNewPrice > amount ? mintableAtNewPrice - amount : 0n;
	const additionalMintableReserve = (BigInt(position.reserveContribution) * additionalMintable) / 1_000_000n;

	const errorBorrow =
		amount > availableAmount
			? `No more than ${formatCurrency(formatUnits(availableAmount, 18))} ZCHF can be received in total`
			: amount > borrowingLimit
			? "Mint amount exceeds your collateral's value at the price"
			: "";

	const now = Date.now();
	const isPositionBlocked = position.start * 1000 > now || (position.start * 1000 < now && position.cooldown > now);

	const collKey = normalizeAddress(position.collateral);
	const bestRatePos = bestInterestByCollateral[collKey];
	const posEffectiveRate = position.annualInterestPPM / (1_000_000 - position.reserveContribution);
	const bestEffectiveRate = bestRatePos ? bestRatePos.annualInterestPPM / (1_000_000 - bestRatePos.reserveContribution) : Infinity;

	const alternativeRows = [
		{
			label: "Best Price",
			pos: bestPriceByCollateral[collKey],
			value: `${formatCurrency(
				formatUnits(BigInt(bestPriceByCollateral[collKey]?.price ?? 0), 36 - position.collateralDecimals)
			)} ZCHF`,
			isBest: priceBigInt >= BigInt(bestPriceByCollateral[collKey]?.price ?? 0),
		},
		{
			label: "Best Rate",
			pos: bestRatePos,
			value: bestRatePos
				? `${formatCurrency((bestRatePos.annualInterestPPM / (1_000_000 - bestRatePos.reserveContribution)) * 100)}%`
				: "",
			isBest: posEffectiveRate <= bestEffectiveRate,
		},
		{
			label: "Best Expiry",
			pos: bestExpirationByCollateral[collKey],
			value: formatDateFromSecs(bestExpirationByCollateral[collKey]?.expiration ?? 0),
			isBest: (originalExpiration ?? 0) >= (bestExpirationByCollateral[collKey]?.expiration ?? 0),
		},
		{
			label: "Best Availability",
			pos: bestAvailabilityByCollateral[collKey],
			value: `${formatCurrency(formatUnits(BigInt(bestAvailabilityByCollateral[collKey]?.availableForClones ?? 0), 18))} ZCHF`,
			isBest: BigInt(position.availableForClones) >= BigInt(bestAvailabilityByCollateral[collKey]?.availableForClones ?? 0),
		},
	];
	const hasAlternatives = alternativeRows.some(({ pos, isBest }) => pos && !isBest);

	const onChangeCollateral = (value: string) => {
		const newColl = BigInt(value);
		setCollAmount(newColl);
		if (linked && mintPrice > 0n) {
			setAmount((newColl * mintPrice) / parseUnits("1", 18));
		}
	};

	const onChangeAmount = (value: string) => {
		const newAmount = BigInt(value);
		setAmount(newAmount);
		if (linked && mintPrice > 0n) {
			setCollAmount((newAmount * parseUnits("1", 18) + mintPrice - 1n) / mintPrice);
		}
	};

	const onChangeLiqPrice = (v: bigint) => {
		setNewPrice(v);
		const effectivePrice = v <= priceBigInt ? v : priceBigInt;
		setMintPrice(effectivePrice);
		if (linked && collAmount > 0n) {
			setAmount((collAmount * effectivePrice) / parseUnits("1", 18));
		}
	};

	const onChangeExpiration = (value: Date | null) => {
		if (!value) value = new Date();
		const newTimestamp = toTimestamp(value);
		const bottomLimit = toTimestamp(new Date());
		const upperLimit = originalExpiration ?? position.expiration;

		if (newTimestamp < bottomLimit || newTimestamp > upperLimit) {
			setErrorDate("Expiration Date should be between Now and Limit");
		} else {
			setErrorDate("");
		}
		setExpirationDate(value);
	};

	const onTabExpiration = (t: string) => {
		setExpirationTab(t);
		onChangeExpiration(expirationTabDates[t] ?? expirationMax);
	};

	return (
		<div className="flex flex-col md:max-w-2xl mx-auto">
			<Head>
				<title>Frankencoin - Borrow</title>
			</Head>

			<AppTitle title="Borrow Frankencoins">
				<div className="text-text-secondary">
					Deposit{" "}
					{DISCUSSIONS[position.collateral] ? (
						<AppLink
							className=""
							label={`${position.collateralName} (${position.collateralSymbol})`}
							href={DISCUSSIONS[position.collateral]}
							external={true}
						/>
					) : (
						<span>
							{position.collateralName} ({position.collateralSymbol})
						</span>
					)}{" "}
					as collateral and mint new Frankencoins against it, cloning the terms from position{" "}
					<AppLink
						className=""
						label={shortenAddress(position.position)}
						href={`/monitoring/${position.position}`}
						external={false}
					/>
					.
				</div>
			</AppTitle>

			<div className="mt-8">
				<section className="grid grid-cols-1 gap-4">
					<AppCard>
						<div className="text-lg font-bold text-center">Borrow Frankencoins</div>
						<div className="grid md:grid-cols-2 gap-4">
							<TokenInput
								label="Deposit"
								max={userBalance >= minColl ? userBalance : undefined}
								min={mintPrice > 0n ? (amount * parseUnits("1", 18) + mintPrice - 1n) / mintPrice : undefined}
								reset={minColl}
								digit={position.collateralDecimals}
								onChange={onChangeCollateral}
								error={errorColl}
								placeholder="Amount"
								value={String(collAmount)}
								symbol={position.collateralSymbol}
								limit={userBalance}
								limitDigit={position.collateralDecimals}
								limitLabel="Balance"
							/>
							<TokenInput
								label="Mint now"
								symbol="ZCHF"
								value={amount.toString()}
								onChange={onChangeAmount}
								max={borrowingLimit}
								onMax={() => setAmount(borrowingLimit)}
								error={errorBorrow}
								showButtons={true}
								limit={borrowingLimit}
								limitDigit={18}
								limitLabel="Mintable"
							/>
						</div>

						<div className="py-1 text-center">
							{linked ? (
								<Button className="h-10 rounded-full" width="w-10" onClick={() => setLinked(false)}>
									<FontAwesomeIcon icon={faLink} className="w-5 h-5" />
								</Button>
							) : (
								<ButtonSecondary
									className="h-10 rounded-full"
									width="w-10"
									onClick={() => {
										setLinked(true);
										if (mintPrice > 0n) setAmount((collAmount * mintPrice) / parseUnits("1", 18));
									}}
								>
									<FontAwesomeIcon icon={faLinkSlash} className="w-5 h-5" />
								</ButtonSecondary>
							)}
						</div>

						<div className="grid md:grid-cols-1 gap-4">
							<LiquidationSlider
								label="Liquidation Price"
								value={newPrice}
								digit={priceDigit}
								sliderMin={parseUnits(String(collateralPriceZchf * 0.1), priceDigit)}
								sliderMax={parseUnits(String(collateralPriceZchf), priceDigit)}
								sliderSource={priceBigInt}
								min={collAmount > 0n ? (amount * parseUnits("1", 18)) / collAmount : undefined}
								max={parseUnits(String(collateralPriceZchf), priceDigit)}
								reset={priceBigInt}
								onChange={onChangeLiqPrice}
								limit={ltvLimit}
								limitDigit={6}
								limitLabel="LTV"
								limitUnit="%"
								error={newPrice == 0n ? "Needs to be greater than zero" : ""}
								warning={
									newPrice > priceBigInt
										? `Liquidation prices above the reference become effective after a 3-day cooldown. Afterwards, up to ${formatCurrency(
												formatUnits(additionalMintable, 18)
										  )} more ZCHF can be minted.`
										: undefined
								}
							/>

							<DateInput
								label="Repay by"
								value={expirationDate}
								onChange={onChangeExpiration}
								error={errorDate}
								max={expirationMax}
								tabs={["1M", "3M", "6M", "1Y", "Max"]}
								tabDates={expirationTabDates}
								tab={expirationTab}
								onTab={onTabExpiration}
							/>
						</div>

						<div className="flex-1 mb-4">
							{newPrice > priceBigInt && (
								<div className="text-amber-500">
									<div className="flex">
										<div className="flex-1">
											<span>Mintable after cooldown</span>
										</div>
										<div className="text-right">
											<span>{formatCurrency(formatUnits(mintableAtNewPrice, 18))} ZCHF</span>
										</div>
									</div>

									<div className="mt-0 flex">
										<div className="flex-1">
											<span>Usable after cooldown</span>
										</div>
										<div className="text-right">
											{additionalMintable > 0n ? "-" : ""}
											<span>{formatCurrency(formatUnits(additionalMintable, 18))} ZCHF</span>
										</div>
									</div>
								</div>
							)}

							<div className="mt-2 flex">
								<div className="flex-1 text-text-secondary">
									<span>Mint now</span>
									<span className="text-xs ml-1">(100%)</span>
								</div>
								<div className="text-right">
									<span>{formatCurrency(formatUnits(amount, 18))} ZCHF</span>
								</div>
							</div>

							<div className="mt-0 flex">
								<div className="flex-1 text-text-secondary">
									<span>Retained reserve</span>
									<span className="text-xs ml-1">({formatCurrency(position.reserveContribution / 10000)}%)</span>
								</div>
								<div className="text-right">
									<span>
										{amount > 0n ? "-" : ""}
										{formatCurrency(formatUnits(borrowersReserveContribution, 18))} ZCHF
									</span>
								</div>
							</div>

							<div className="mt-2 flex">
								<div className="flex-1 text-text-secondary">
									<span>To be repaid in the end</span>
									<span className="text-xs ml-1">({formatCurrency(100 - position.reserveContribution / 10000)}%)</span>
								</div>
								<div className="text-right">
									<span>
										{formatCurrency(
											formatUnits((amount * BigInt(100 - position.reserveContribution / 10000)) / 100n, 18)
										)}{" "}
										ZCHF
									</span>
								</div>
							</div>

							<div className="mt-0 flex">
								<div className="flex-1 text-text-secondary">
									<span>Upfront interest</span>
									<span className="text-xs ml-1">({formatCurrency(effectiveInterest * 100)}% per year)</span>
								</div>
								<div className="text-right">
									<span>
										{amount > 0n ? "-" : ""}
										{formatCurrency(formatUnits(fees, 18))} ZCHF
									</span>
								</div>
							</div>

							<div className="mt-2 flex font-extrabold">
								<div className="flex-1 text-text-secondary">
									<span>Sent to your wallet</span>
								</div>
								<div className="text-right">
									<span>{formatCurrency(formatUnits(paidOutToWallet, 18))} ZCHF</span>
								</div>
							</div>
						</div>

						<div className="mx-auto w-full flex-col">
							{position.version == 2 && newPrice !== priceBigInt ? (
								<BorrowClonePriceAction
									position={position}
									collAmount={collAmount}
									requiredColl={requiredColl}
									amount={amount}
									expirationDate={expirationDate}
									newPrice={newPrice}
									userAllowance={userAllowanceHelper}
									userBalance={userBalance}
									disabled={!!errorColl || !!errorBorrow || isPositionBlocked}
								/>
							) : (
								<BorrowCloneAction
									position={position}
									collAmount={collAmount}
									requiredColl={requiredColl}
									amount={amount}
									expirationDate={expirationDate}
									userAllowance={userAllowance}
									userBalance={userBalance}
									disabled={!!errorColl || !!errorBorrow || isPositionBlocked}
								/>
							)}
						</div>

						{isPositionBlocked && (
							<div className="flex my-2 px-2 text-amber-500">
								{position.start * 1000 > now
									? "This position is pending governance approval."
									: "This position is in a cooldown period."}
							</div>
						)}
					</AppCard>

					<div className="grid gap-4">
						{hasAlternatives && (
							<AppCard>
								<div className="text-lg font-bold text-center mt-3">Alternative Terms</div>
								<div className="flex-1 mt-4">
									<div className="grid grid-cols-3 text-xs text-text-secondary pb-1 border-b border-gray-200 mb-1">
										<div>Term</div>
										<div className="text-center">Value</div>
										<div className="text-right">Best</div>
									</div>
									{alternativeRows.map(({ label, pos, value, isBest }) => {
										if (!pos) return null;
										return (
											<div
												key={label}
												className={`grid grid-cols-3 py-2 text-sm border-b border-gray-100 last:border-0 ${
													isBest ? "text-text-secondary" : "cursor-pointer"
												}`}
												onClick={() => !isBest && navigate.push(`/mint/${pos.position}`)}
											>
												<div className="text-text-secondary">{label}</div>
												<div className="text-center font-medium text-text-primary">{value}</div>
												<div className="text-right">
													{isBest ? (
														<span className="font-bold text-green-500">✓</span>
													) : (
														<span className="inline-block text-xs px-2 py-0.5 rounded-full bg-button-default hover:bg-button-hover text-white font-medium">
															Select
														</span>
													)}
												</div>
											</div>
										);
									})}
								</div>
								<div className="mt-2">
									<ButtonSecondary onClick={() => navigate.push(`/mint/create?source=${addressQuery}`)}>
										Need different terms?
									</ButtonSecondary>
								</div>
							</AppCard>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
