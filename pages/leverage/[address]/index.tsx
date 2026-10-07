import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits, erc20Abi, Address } from "viem";
import { useAccount, useBlockNumber } from "wagmi";
import { readContract } from "wagmi/actions";
import {
	formatCurrency,
	normalizeAddress,
	toTimestamp,
	DISCUSSIONS,
	LEVERAGE_EXECUTOR_ADDRESS,
	SECS_PER_YEAR,
	LEVERAGE_FLASHLOAN_PROVIDER,
} from "@utils";
import DateInput from "@components/Input/DateInput";
import TokenInput from "@components/Input/TokenInput";
import { TabInput } from "@components/Input/TabInput";
import { WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { ADDRESS } from "@frankencoin/zchf";
import AppLink from "@components/AppLink";
import { mainnet } from "viem/chains";
import AppCard from "@components/AppCard";
import AppTitle from "@components/AppTitle";
import AppBox from "@components/AppBox";
import LeverageAction, { LeverageMode } from "@components/PageLeverage/LeverageAction";

const SLIPPAGE_TABS: Record<string, number> = { "0.5%": 50, "1%": 100, "2%": 200 };

function toDate(time: bigint | number | string) {
	return new Date(Number(BigInt(time)) * 1000);
}

// normalise a price with `digit` decimals to 18 decimals
function to18(value: bigint, digit: number): bigint {
	return digit >= 18 ? value / 10n ** BigInt(digit - 18) : value * 10n ** BigInt(18 - digit);
}

export default function PositionLeverage() {
	const [mode, setMode] = useState<LeverageMode>("zchf");
	const [equityInput, setEquityInput] = useState(0n);
	const [marketPriceInput, setMarketPriceInput] = useState(0n);
	const [slippageTab, setSlippageTab] = useState<string>("1%");
	const [expirationDate, setExpirationDate] = useState<Date>(new Date(0));
	const [expirationTab, setExpirationTab] = useState<string>("1Y");
	const [errorDate, setErrorDate] = useState("");
	const [isInit, setInit] = useState(false);

	const [zchfBalance, setZchfBalance] = useState(0n);
	const [zchfAllowance, setZchfAllowance] = useState(0n);
	const [collBalance, setCollBalance] = useState(0n);
	const [collAllowance, setCollAllowance] = useState(0n);

	const { data: blockNumber } = useBlockNumber({ watch: true });
	const account = useAccount();
	const router = useRouter();

	const chainId = mainnet.id;
	const addressQuery: Address = router.query.address as Address;
	const zchfAddress = ADDRESS[chainId].frankencoin;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == addressQuery);
	const originalPosition = position?.isClone ? positions.find((p) => p.position === position.original) : position;
	const originalExpiration = originalPosition?.expiration ?? position?.expiration;

	const prices = useSelector((state: RootState) => state.prices.coingecko);

	useEffect(() => {
		if (isInit) return;
		if (!position || position.expiration == 0) return;
		const collPriceZCHF = prices[normalizeAddress(position.collateral)]?.price?.chf ?? 0;
		if (collPriceZCHF <= 0) return; // wait for oracle price before initialising

		const pd = 36 - position.collateralDecimals;
		setMarketPriceInput(parseUnits(collPriceZCHF.toFixed(pd), pd));

		const _now = new Date();
		const oneYearOut = new Date(_now.getFullYear() + 1, _now.getMonth(), _now.getDate());
		const expirationMax = toDate(originalExpiration ?? position.expiration);
		setExpirationDate(oneYearOut < expirationMax ? oneYearOut : expirationMax);
		setInit(true);
	}, [position, isInit, originalExpiration, prices]);

	const collateralAddress = position?.collateral as Address | undefined;
	useEffect(() => {
		const acc = account.address;
		if (!acc || !collateralAddress) return;

		const read = (token: Address, functionName: "balanceOf" | "allowance") =>
			readContract(WAGMI_CONFIG, {
				address: token,
				chainId,
				abi: erc20Abi,
				functionName,
				args: functionName == "balanceOf" ? [acc] : [acc, LEVERAGE_EXECUTOR_ADDRESS],
			} as any) as Promise<bigint>;

		const fetchAsync = async () => {
			const [zb, za, cb, ca] = await Promise.all([
				read(zchfAddress, "balanceOf"),
				read(zchfAddress, "allowance"),
				read(collateralAddress, "balanceOf"),
				read(collateralAddress, "allowance"),
			]);
			setZchfBalance(zb);
			setZchfAllowance(za);
			setCollBalance(cb);
			setCollAllowance(ca);
		};

		fetchAsync();
	}, [blockNumber, account.address, collateralAddress, zchfAddress, chainId]);

	if (!position) return null;

	// ── Tokens & prices ──────────────────────────────────────────────────
	const dec = position.collateralDecimals;
	const priceDigit = 36 - dec;
	const liqPriceBigInt = BigInt(position.price);
	const liqPriceFloat = parseFloat(formatUnits(liqPriceBigInt, priceDigit));
	const collKey = normalizeAddress(position.collateral);
	const oraclePrice = prices[collKey]?.price?.chf ?? 0; // reference (display only)
	const oraclePriceBigInt = parseUnits(Math.max(0, oraclePrice).toFixed(priceDigit), priceDigit);
	const expirationMax = toDate(originalExpiration ?? position.expiration);
	const marketPriceFloat = parseFloat(formatUnits(marketPriceInput, priceDigit));

	const isZchf = mode == "zchf";
	const equityToken = isZchf
		? { address: zchfAddress as Address, symbol: "ZCHF", decimals: 18 }
		: { address: position.collateral as Address, symbol: position.collateralSymbol, decimals: dec };
	const userBalance = isZchf ? zchfBalance : collBalance;
	const userAllowance = isZchf ? zchfAllowance : collAllowance;
	const equity = equityInput;

	// ── Fees ─────────────────────────────────────────────────────────────
	const durationSecs = Math.max(0, expirationDate.getTime() - Date.now()) / 1000;
	const durationYears = durationSecs / SECS_PER_YEAR;
	const reserveRatio = position.reserveContribution / 1_000_000;
	const annualRate = position.annualInterestPPM / 1_000_000;
	const feeRatio = annualRate * durationYears;
	const mLTV = marketPriceFloat > 0 ? liqPriceFloat / marketPriceFloat : 0;

	// ── Sizing, mirrors LeverageGeneric ──────────────────────────────────
	// credit  = liq × (1 − res − fee) / market           (net ZCHF released per ZCHF of collateral value)
	// flow 1: C = z / (market − liq×net)                 equity z in ZCHF, flashloan C collateral
	// flow 2: C = e / (1 − credit)                       equity e in collateral, flashloan C − e
	// The market price is worsened by the slippage so that the swap output still covers the flashloan.
	const slippageBps = SLIPPAGE_TABS[slippageTab] ?? 100;
	const interestPPM = BigInt(Math.floor((position.annualInterestPPM * durationSecs) / SECS_PER_YEAR));
	const resPPM = BigInt(position.reserveContribution);
	const netPPM = 1_000_000n > resPPM + interestPPM ? 1_000_000n - resPPM - interestPPM : 0n;

	const unit = 10n ** BigInt(dec);
	const liq18 = to18(liqPriceBigInt, priceDigit);
	const marketEff18 = (to18(marketPriceInput, priceDigit) * BigInt(10_000 + slippageBps)) / 10_000n;
	const credit18 = (liq18 * netPPM) / 1_000_000n; // ZCHF released per whole token
	const spread18 = marketEff18 - credit18;

	const sizingOk = spread18 > 0n && marketEff18 > 0n;
	const collateralAmount = !sizingOk
		? 0n
		: isZchf
		? (equity * unit) / spread18
		: (equity * marketEff18) / spread18;
	const canLeverage = sizingOk && credit18 > 0n && collateralAmount > equity * (isZchf ? 0n : 1n);

	const flashloanAmount = isZchf ? collateralAmount : collateralAmount > equity ? collateralAmount - equity : 0n; // collateral units
	const mintGross = (collateralAmount * liqPriceBigInt) / 10n ** 18n;
	const reserveLocked = (mintGross * resPPM) / 1_000_000n;
	const interestCost = (mintGross * interestPPM) / 1_000_000n;
	const mintNet = (mintGross * netPPM) / 1_000_000n;
	// the swap input after the mint (ZCHF): equity + mintNet (flow 1) or mintNet (flow 2)
	const swapIn = isZchf ? equity + mintNet : mintNet;
	const swapOutExpected = marketPriceInput > 0n ? (swapIn * unit) / to18(marketPriceInput, priceDigit) : 0n;

	const f = (v: bigint, d: number) => parseFloat(formatUnits(v, d));
	const collFloat = f(collateralAmount, dec);
	const flashloanFloat = f(flashloanAmount, dec);
	const mintGrossFloat = f(mintGross, 18);
	const mintNetFloat = f(mintNet, 18);
	const reserveFloat = f(reserveLocked, 18);
	const interestFloat = f(interestCost, 18);
	const swapInFloat = f(swapIn, 18);
	const swapOutFloat = f(swapOutExpected, dec);
	const equityFloat = f(equity, equityToken.decimals);

	// leverage: position collateral value / equity value
	const equityValue = isZchf ? equityFloat : equityFloat * marketPriceFloat;
	const leverage = equityValue > 0 ? (collFloat * marketPriceFloat) / equityValue : 0;

	// ── Minimum equity so that C ≥ minimumCollateral ─────────────────────
	const minColl = BigInt(position.minimumCollateral);
	const minEquity = !sizingOk
		? 0n
		: isZchf
		? (minColl * spread18) / unit
		: (minColl * spread18) / marketEff18;
	const minEquityFloat = f(minEquity, equityToken.decimals);

	// ── Expiration ───────────────────────────────────────────────────────
	const _now = new Date();
	const expirationTabDates: Record<string, Date> = {
		"1M": new Date(_now.getFullYear(), _now.getMonth() + 1, _now.getDate()),
		"3M": new Date(_now.getFullYear(), _now.getMonth() + 3, _now.getDate()),
		"6M": new Date(_now.getFullYear(), _now.getMonth() + 6, _now.getDate()),
		"1Y": new Date(_now.getFullYear() + 1, _now.getMonth(), _now.getDate()),
		Max: expirationMax,
	};

	const onChangeExpiration = (value: Date | null) => {
		if (!value) value = new Date();
		const ts = toTimestamp(value);
		const lo = toTimestamp(new Date());
		const hi = originalExpiration ?? position.expiration;
		setErrorDate(ts < lo || ts > hi ? "Expiration must be between now and the position limit" : "");
		setExpirationDate(value);
	};

	const onTabExpiration = (t: string) => {
		setExpirationTab(t);
		onChangeExpiration(expirationTabDates[t] ?? expirationMax);
	};

	const onTabMode = (t: string) => {
		setMode(t == "Deposit ZCHF" ? "zchf" : "collateral");
		setEquityInput(0n);
	};

	// ── Validation ───────────────────────────────────────────────────────
	const errorInput =
		equity > 0n && equity < minEquity
			? `Minimum ~${formatCurrency(minEquityFloat, 0, 4)} ${equityToken.symbol} to meet the collateral floor`
			: account.address && equity > userBalance
			? `Not enough ${equityToken.symbol} in your wallet`
			: "";

	const now = Date.now();
	const isCooldown = position.start * 1000 < now && position.cooldown * 1000 > now;
	const isBlocked = position.start * 1000 > now || isCooldown;
	const positionStatus = position.closed
		? { label: "Closed", cls: "bg-red-500/20 text-red-400" }
		: isCooldown
		? { label: "Cooldown", cls: "bg-amber-500/20 text-amber-400" }
		: { label: "Active", cls: "bg-green-500/20 text-green-400" };

	const maxLeverage = sizingOk && credit18 > 0n ? 1 / (1 - f(credit18, 18) / f(marketEff18, 18)) : 0;

	return (
		<div className="flex flex-col md:max-w-2xl mx-auto">
			<Head>
				<title>Frankencoin - Leverage</title>
			</Head>

			<AppTitle
				title={`${position.collateralName} (${position.collateralSymbol})`}
				subtitle={`Open a leveraged position with ${equityToken.symbol}, funded by a ${position.collateralSymbol} flashloan`}
				badges={[
					{ label: positionStatus.label, className: positionStatus.cls },
					{
						label: maxLeverage > 0 ? `up to ${formatCurrency(maxLeverage)}×` : "No leverage",
						className: "bg-purple-500/20 text-purple-400",
					},
					{ label: `${formatCurrency(mLTV * 100)}% LTV`, className: "bg-gray-500/20 text-gray-400" },
				]}
				actions={
					<div className="flex flex-wrap gap-4 text-sm">
						<AppLink label="Reference" href={`/monitoring/${position.position}`} external={false} />
						{DISCUSSIONS[collKey] && <AppLink label="Discussion" href={DISCUSSIONS[collKey]} external={true} />}
					</div>
				}
			/>

			<div className="mt-8 space-y-4">
				<AppCard>
					<div className="text-lg font-bold text-center">Open Leveraged Position</div>

					<TabInput
						tabs={["Deposit ZCHF", `Deposit ${position.collateralSymbol}`]}
						tab={isZchf ? "Deposit ZCHF" : `Deposit ${position.collateralSymbol}`}
						setTab={((t: string) => onTabMode(t)) as any}
					/>

					{!canLeverage && equity > 0n && (
						<div className="my-2 px-3 py-2 rounded bg-red-500/10 text-red-400 text-sm text-center">
							Leverage unavailable: market price with slippage must exceed the credit per token
						</div>
					)}

					<div className="space-y-4">
						<TokenInput
							label="Equity"
							symbol={equityToken.symbol}
							value={String(equityInput)}
							onChange={(v) => setEquityInput(BigInt(v))}
							min={minEquity}
							max={userBalance}
							reset={minEquity}
							digit={equityToken.decimals}
							error={errorInput}
							limit={userBalance}
							limitDigit={equityToken.decimals}
							limitLabel="Balance"
						/>

						<TokenInput
							label={`${position.collateralSymbol} Price`}
							symbol="ZCHF"
							value={String(marketPriceInput)}
							onChange={(v) => setMarketPriceInput(BigInt(v))}
							reset={oraclePriceBigInt}
							digit={priceDigit}
							limit={oraclePriceBigInt}
							limitDigit={priceDigit}
							limitLabel="Oracle"
						/>

						<DateInput
							label="Position expires"
							value={expirationDate}
							onChange={onChangeExpiration}
							error={errorDate}
							max={expirationMax}
							tabs={["1M", "3M", "6M", "1Y", "Max"]}
							tabDates={expirationTabDates}
							tab={expirationTab}
							onTab={onTabExpiration}
						/>

						<div>
							<div className="text-sm text-text-secondary mb-1">Swap slippage</div>
							<TabInput tabs={Object.keys(SLIPPAGE_TABS)} tab={slippageTab} setTab={setSlippageTab} />
						</div>
					</div>

					{/* ── Position Parameters ── */}
					<AppBox tight={true}>
						<div className="text-sm font-semibold text-text-secondary mb-2">Position Parameters</div>

						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Liquidation price</span>
							<span>{formatCurrency(liqPriceFloat)} ZCHF</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Market price</span>
							<span>{formatCurrency(marketPriceFloat)} ZCHF</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Market LTV (liq / market)</span>
							<span>{formatCurrency(mLTV * 100)}%</span>
						</div>
						<div className="mt-2 flex justify-between text-sm">
							<span className="text-text-secondary">Reserve contribution</span>
							<span>−{formatCurrency(reserveRatio * 100)}%</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">
								Interest ({formatCurrency(annualRate * 100)}% / yr × {formatCurrency(durationYears, 0, 2)} yr)
							</span>
							<span>−{formatCurrency(feeRatio * 100)}%</span>
						</div>
					</AppBox>

					{/* ── Flashloan ── */}
					<AppBox tight={true}>
						<div className="text-sm font-semibold text-text-secondary mb-2">1. Flashloan (Morpho)</div>

						<div className="flex justify-between text-sm font-extrabold">
							<span className="text-text-secondary">Borrowed collateral</span>
							<span>
								{formatCurrency(flashloanFloat, 0, dec)} {position.collateralSymbol}
							</span>
						</div>
						{!isZchf && (
							<div className="flex justify-between text-sm">
								<span className="text-text-secondary">Your equity</span>
								<span>
									{formatCurrency(equityFloat, 0, dec)} {position.collateralSymbol}
								</span>
							</div>
						)}
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Deposited into the position</span>
							<span>
								{formatCurrency(collFloat, 0, dec)} {position.collateralSymbol}
							</span>
						</div>
					</AppBox>

					{/* ── Mint ── */}
					<AppBox tight={true}>
						<div className="text-sm font-semibold text-text-secondary mb-2">2. Mint</div>

						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Minted gross</span>
							<span>{formatCurrency(mintGrossFloat)} ZCHF</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Reserve ({formatCurrency(reserveRatio * 100)}%)</span>
							<span>−{formatCurrency(reserveFloat)} ZCHF</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Interest</span>
							<span>−{formatCurrency(interestFloat)} ZCHF</span>
						</div>
						<div className="mt-2 border-t border-border pt-2 flex justify-between text-sm font-semibold">
							<span className="text-text-secondary">Received</span>
							<span>{formatCurrency(mintNetFloat)} ZCHF</span>
						</div>
					</AppBox>

					{/* ── Swap ── */}
					<AppBox tight={true}>
						<div className="text-sm font-semibold text-text-secondary mb-2">3. Swap (Enso)</div>

						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">ZCHF in {isZchf ? "(equity + minted)" : "(minted)"}</span>
							<span>{formatCurrency(swapInFloat)} ZCHF</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Expected out</span>
							<span>
								{formatCurrency(swapOutFloat, 0, dec)} {position.collateralSymbol}
							</span>
						</div>
						<div className="mt-2 border-t border-border pt-2 flex justify-between text-sm font-semibold">
							<span className="text-text-secondary">Repays flashloan, rest is sent to you</span>
							<span>
								{formatCurrency(flashloanFloat, 0, dec)} {position.collateralSymbol}
							</span>
						</div>
					</AppBox>

					{/* ── Result ── */}
					<AppBox tight={true}>
						<div className="text-sm font-semibold text-text-secondary mb-2">Result</div>

						<div className="flex justify-between text-sm font-bold">
							<span className="text-text-secondary">Leverage</span>
							<span className={canLeverage ? "text-purple-400" : "text-red-400"}>
								{leverage > 0 ? `${formatCurrency(leverage)}×` : "—"}
							</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Position collateral</span>
							<span>
								{formatCurrency(collFloat, 0, dec)} {position.collateralSymbol}
							</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Position debt</span>
							<span>{formatCurrency(mintGrossFloat)} ZCHF</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Liquidation price</span>
							<span>{formatCurrency(liqPriceFloat)} ZCHF</span>
						</div>
					</AppBox>

					<div className="mx-auto w-full flex-col">
						<LeverageAction
							position={position}
							mode={mode}
							equityToken={equityToken}
							equity={equity}
							collateralAmount={collateralAmount}
							swapIn={(swapIn * 999n) / 1000n}
							slippageBps={slippageBps}
							expirationDate={expirationDate}
							userAllowance={userAllowance}
							userBalance={userBalance}
							disabled={!canLeverage || !!errorInput || !!errorDate || isBlocked || equity == 0n}
						/>
					</div>

					{isBlocked && (
						<div className="flex my-2 px-2 text-amber-500 text-sm">
							{position.start * 1000 > now ? "Position is pending governance approval." : "Position is in a cooldown period."}
						</div>
					)}
				</AppCard>

				{/* ── Mechanism Info ── */}
				<AppCard>
					<div className="text-lg font-bold text-center mt-1">How It Works</div>
					<div className="mt-3 space-y-2 text-sm text-text-secondary">
						<p>
							1. A flashloan of{" "}
							<span className="text-text-primary">
								{formatCurrency(flashloanFloat, 0, dec)} {position.collateralSymbol}
							</span>{" "}
							is taken from Morpho
							{isZchf ? "." : `, on top of your ${formatCurrency(equityFloat, 0, dec)} ${position.collateralSymbol}.`}
						</p>
						<p>
							2. The full{" "}
							<span className="text-text-primary">
								{formatCurrency(collFloat, 0, dec)} {position.collateralSymbol}
							</span>{" "}
							is deposited into a cloned position, which mints{" "}
							<span className="text-text-primary">{formatCurrency(mintGrossFloat)} ZCHF</span> gross,{" "}
							{formatCurrency(mintNetFloat)} ZCHF net after reserve and interest.
						</p>
						<p>
							3. {isZchf ? "Your ZCHF plus the minted ZCHF are" : "The minted ZCHF is"} swapped through Enso into{" "}
							<span className="text-text-primary">
								~{formatCurrency(swapOutFloat, 0, dec)} {position.collateralSymbol}
							</span>
							, which repays the flashloan. Any excess is sent to you.
						</p>
						<p>
							4. You own the position at{" "}
							<span className="text-purple-400 font-semibold">{leverage > 0 ? `${formatCurrency(leverage)}×` : "—"}</span>{" "}
							leverage.
						</p>
						<p className="text-xs pt-1">
							Liquidation threshold: {position.collateralSymbol} price drops to {formatCurrency(liqPriceFloat)} ZCHF. Flashloan source:{" "}
							{LEVERAGE_FLASHLOAN_PROVIDER.slice(0, 8)}… (Morpho Blue, no fee).
						</p>
					</div>
				</AppCard>
			</div>
		</div>
	);
}
