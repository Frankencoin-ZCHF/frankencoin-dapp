import Link from "next/link";
import { ReactNode } from "react";
import { useSelector } from "react-redux";
import { useConnection } from "wagmi";
import { formatUnits, zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { ADDRESS } from "@frankencoin/zchf";
import AppCard from "@components/AppCard";
import BuyZchf from "@components/BuyZchf";
import { RootState } from "../../redux/redux.store";
import { formatCurrency, normalizeAddress } from "@utils";
import { track, useBackingHistory, useCalcData, useFCSStats, useSavingsAccounts, useZchfWalletBalance } from "@hooks";
import { BarChart, CHART_BLUE, CHART_GREEN, TimeChart, shortAmount as short } from "./StartChart";

const num = (wei: bigint) => Number(formatUnits(wei, 18));
const amount = (wei: bigint, digits = 2) => formatCurrency(formatUnits(wei, 18), digits, digits) ?? "0";
const whole = (v: number) => formatCurrency(Math.round(v), 0, 0) ?? "0";
const pct = (f: number, digits = 2) => `${(f * 100).toFixed(digits).replace(/\.?0+$/, "")}%`;
const MONTH_S = 30 * 86400;

interface Stat {
	// null while the figure is loading or cannot be read
	value: string | null;
	label: string;
	// a figure about this wallet, shown highlighted
	own?: boolean;
}

interface RowProps {
	label: string;
	value: string;
	unit: string;
	detail: ReactNode;
	chart: ReactNode;
	stats: Stat[];
	children: ReactNode;
}

function Row({ label, value, unit, detail, chart, stats, children }: RowProps) {
	return (
		<AppCard className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)] gap-x-8 gap-y-5">
			<div className="min-w-0 flex flex-col gap-4">
				<div>
					<div className="text-xs tracking-wider font-bold text-text-secondary">{label.toUpperCase()}</div>
					<div className="mt-1 flex items-baseline gap-2 flex-wrap">
						<span className="text-3xl md:text-4xl font-extrabold text-text-primary tabular-nums">{value}</span>
						<span className="text-lg font-bold text-text-secondary">{unit}</span>
					</div>
					<div className="text-sm text-text-secondary">{detail}</div>
				</div>
				<div className="flex flex-col gap-2">{children}</div>
			</div>
			<div className="min-w-0 flex flex-col gap-3">
				{chart}
				<div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
					{stats.map((s) => (
						<span key={s.label} className="text-text-secondary">
							<span className={`font-bold tabular-nums ${s.own ? "text-text-success" : "text-text-primary"}`}>
								{s.value ?? "…"}
							</span>{" "}
							{s.label}
						</span>
					))}
				</div>
			</div>
		</AppCard>
	);
}

function Action({ href, label, event }: { href: string; label: string; event: string }) {
	return (
		<Link
			href={href}
			onClick={() => track(event)}
			className="btn bg-button-default text-white hover:bg-button-hover py-2 md:py-2 text-sm"
		>
			{label}
		</Link>
	);
}

/**
 * One row per product (ZCHF held, savings, borrowing, FCS): the wallet's number, three figures and the
 * action that leads further. A wallet that uses the product sees its own figures first; otherwise the
 * row shows the protocol's. Every figure is read from the chain or the Frankencoin API; one that cannot
 * be loaded shows "…" instead of an estimate.
 */
export default function StartDashboard() {
	const { address, isConnected } = useConnection();
	const account = address ?? zeroAddress;
	const dash = isConnected ? undefined : "—";

	// protocol
	const { status, totalInterest, totalBalance } = useSelector((state: RootState) => state.savings.savingsInfo);
	const saveRatePPM = status?.[mainnet.id]?.[normalizeAddress(ADDRESS[mainnet.id].savingsReferral)]?.rate ?? 0;
	const saveRate = saveRatePPM / 1_000_000;
	const paidOut = typeof totalInterest == "number" ? totalInterest : 0;
	const totalSaved = typeof totalBalance == "number" ? totalBalance : 0;
	const supply = useSelector((state: RootState) => state.ecosystem.frankencoinInfo?.token?.supply ?? 0);
	const collateralChf = useSelector((state: RootState) => state.ecosystem.collateralStats?.totalValueLocked?.chf ?? 0);
	const fpsInfo = useSelector((state: RootState) => state.ecosystem.fpsInfo);
	const { data: calc } = useCalcData();
	const roeAll = calc?.current.roeAll ?? null;
	const fcsPrice = fpsInfo?.token?.price || calc?.current.fpsPrice || 0;

	// ZCHF in the wallet, all chains
	const zchf = useZchfWalletBalance();

	// savings on all chains
	const { accounts } = useSavingsAccounts(account);
	const saved = accounts.reduce((s, a) => s + a.saved, 0n);
	const accrued = accounts.reduce((s, a) => s + a.netInterest, 0n);
	const yearly = accounts.reduce((s, a) => s + a.yearlyInterest, 0n);

	// borrowing: open positions with debt, across the protocol and for this owner
	const positions = useSelector((state: RootState) => state.positions.list.list);
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const weighted = (list: typeof positions) => {
		const minted = list.reduce((s, p) => s + BigInt(p.minted), 0n);
		const rate =
			minted > 0n ? Number(list.reduce((s, p) => s + BigInt(p.minted) * BigInt(p.annualInterestPPM), 0n) / minted) / 1_000_000 : null;
		return { minted, rate };
	};
	const open = positions.filter((p) => !p.closed && !p.denied && BigInt(p.minted) > 0n);
	const all = weighted(open);
	const mine = isConnected ? open.filter((p) => normalizeAddress(p.owner) == normalizeAddress(account)) : [];
	const my = weighted(mine);
	const myCollateral = mine.reduce((s, p) => {
		const price = prices?.[normalizeAddress(p.collateral)]?.price?.chf;
		return price ? s + Number(formatUnits(BigInt(p.collateralBalance), p.collateralDecimals)) * price : s;
	}, 0);
	// lowest interest among positions that can be borrowed from right now
	const nowS = Date.now() / 1000;
	const offered = positions.filter(
		(p) =>
			!p.closed &&
			!p.denied &&
			p.start < nowS &&
			p.cooldown < nowS &&
			p.expiration > nowS + MONTH_S &&
			BigInt(p.availableForClones) > 0n
	);
	const lowest = offered.length ? Math.min(...offered.map((p) => p.annualInterestPPM)) / 1_000_000 : null;

	// FCS
	const fcs = useFCSStats();
	const fcsValue = (fcs.fcsAsk * fcs.fcsBalance) / 10n ** 18n;

	// charts
	const backing = useBackingHistory();
	const lastBacking = backing[backing.length - 1];
	// the savings chart starts with the first recorded savings rate; before that there is no rate to show
	const savingsFrom = (calc?.rates[0]?.[0] ?? 0) * 1000;
	const savingsHistory = (calc?.savings ?? []).map(([t, v]) => [t * 1000, v] as [number, number]).filter(([t]) => t >= savingsFrom);
	const rateHistory = (calc?.rates ?? []).map(([t, r]) => [t * 1000, r * 100] as [number, number]);
	if (rateHistory.length && savingsHistory.length)
		rateHistory.push([savingsHistory[savingsHistory.length - 1][0], rateHistory[rateHistory.length - 1][1]]);
	const priceHistory = (calc?.fps ?? []).map(([t, v]) => [t * 1000, v] as [number, number]);
	// one flat step per calendar year, clipped to the span the price line covers
	const roeYears = calc?.roeYears ?? [];
	const priceFrom = priceHistory[0]?.[0] ?? 0;
	const roeHistory = roeYears.flatMap((y) => {
		const v = Math.round(y.roe * 1000) / 10;
		return [[Math.max(y.from * 1000, priceFrom), v] as [number, number], [y.to * 1000, v] as [number, number]];
	});
	const collateralMap = useSelector((state: RootState) => state.ecosystem.collateralStats?.map ?? {});
	const collaterals = Object.values(collateralMap)
		.map((c) => ({ label: c.symbol, values: [c.totalValueLocked?.chf ?? 0, c.totalMinted ?? 0] }))
		.filter((c) => c.values[0] > 0 && c.values[1] > 0)
		.sort((a, b) => b.values[0] - a.values[0])
		.slice(0, 6);

	const rateStat: Stat = { value: saveRate ? `${pct(saveRate)}` : null, label: "a year on savings, withdraw any time" };

	return (
		<div className="flex flex-col gap-4">
			<Row
				label="You hold"
				value={dash ?? amount(zchf.total)}
				unit="ZCHF"
				detail={isConnected ? "in your wallet, on all chains" : "Connect your wallet to see your balance"}
				chart={
					<TimeChart
						series={[
							{
								name: "Collateral value",
								color: CHART_GREEN,
								data: backing.map((p) => [p.t, Math.round(p.collateral)]),
								format: (v) => short(v),
							},
							{
								name: "ZCHF in circulation",
								color: CHART_BLUE,
								data: backing.map((p) => [p.t, Math.round(p.supply)]),
								format: (v) => short(v),
							},
						]}
					/>
				}
				stats={[
					{
						value: lastBacking ? pct(lastBacking.collateral / lastBacking.supply, 0) : null,
						label: "collateral value against all ZCHF in circulation",
					},
					{ value: supply ? `${short(supply)} ZCHF` : null, label: "in circulation on eight chains" },
					{ value: collateralChf ? `${short(collateralChf)} ZCHF` : null, label: "collateral in open positions" },
					...(zchf.total > 0n && saveRate
						? [
								{
									value: `+${whole(num(zchf.total) * saveRate)} ZCHF`,
									label: `a year if you save your balance at today's ${pct(saveRate)}`,
									own: true,
								},
						  ]
						: []),
				]}
			>
				<BuyZchf variant="inline" title={zchf.total > 0n ? "Buy more:" : "Buy ZCHF:"} source="overview" />
			</Row>

			<Row
				label="You are saving"
				value={dash ?? amount(saved + accrued)}
				unit="ZCHF"
				detail={
					!isConnected ? (
						"Interest accrues every block"
					) : accrued > 0n ? (
						<>
							incl. <span className="text-text-success font-semibold">+{amount(accrued)} ZCHF</span> accrued interest
						</>
					) : saved > 0n ? (
						"No accrued interest yet"
					) : (
						"Nothing in savings yet"
					)
				}
				chart={
					<TimeChart
						series={[
							{ name: "ZCHF in savings", color: CHART_BLUE, data: savingsHistory, format: (v) => short(v) },
							{
								name: "Savings rate",
								color: CHART_GREEN,
								data: rateHistory,
								secondary: true,
								stepped: true,
								format: (v) => `${v.toFixed(1)}%`,
							},
						]}
					/>
				}
				stats={[
					yearly > 0n
						? { value: `+${amount(yearly)} ZCHF`, label: `a year on your savings at today's ${pct(saveRate)}`, own: true }
						: rateStat,
					{ value: totalSaved ? `${short(totalSaved)} ZCHF` : null, label: "saved by all savers right now" },
					{ value: paidOut ? `${short(paidOut)} ZCHF` : null, label: "interest paid to savers so far" },
				]}
			>
				<Action href="/savings" label={saved > 0n ? "Deposit more" : "Start saving"} event="overview_save" />
			</Row>

			<Row
				label="You borrowed"
				value={dash ?? amount(my.minted)}
				unit="ZCHF"
				detail={
					!isConnected ? (
						"Against crypto, gold or tokenized shares"
					) : mine.length > 0 ? (
						<>
							<Link href="/mypositions" className="text-card-input-max hover:text-card-input-hover font-semibold">
								{mine.length} open position{mine.length == 1 ? "" : "s"}
							</Link>
							{myCollateral > 0 ? `, collateral worth ${whole(myCollateral)} ZCHF` : ""}
						</>
					) : (
						"No open positions"
					)
				}
				chart={<BarChart names={["Collateral locked", "ZCHF borrowed"]} colors={[CHART_GREEN, CHART_BLUE]} groups={collaterals} />}
				stats={[
					my.rate !== null
						? { value: pct(my.rate), label: "a year, your average interest", own: true }
						: { value: lowest === null ? null : `from ${pct(lowest)}`, label: "a year, lowest interest on offer now" },
					{ value: all.rate === null ? null : pct(all.rate), label: "a year, average interest on all open loans" },
					{
						value: all.minted > 0n ? `${short(num(all.minted))} ZCHF` : null,
						label: `borrowed across ${open.length} open positions`,
					},
				]}
			>
				<Action href="/mint" label={mine.length > 0 ? "Borrow more" : "Borrow ZCHF"} event="overview_borrow" />
			</Row>

			<Row
				label="Your FCS"
				value={dash ?? amount(fcs.fcsBalance)}
				unit="FCS"
				detail={
					!isConnected
						? "Frankencoin Shares, the protocol's equity"
						: fcs.fcsBalance > 0n
						? "Frankencoin Shares in your wallet"
						: "No Frankencoin Shares yet"
				}
				chart={
					<TimeChart
						series={[
							{ name: "FCS price in ZCHF", color: CHART_BLUE, data: priceHistory, format: (v) => whole(v) },
							{
								name: "Return on equity per year, annualized",
								color: CHART_GREEN,
								data: roeHistory,
								secondary: true,
								stepped: true,
								format: (v) => `${v.toFixed(0)}%`,
							},
						]}
					/>
				}
				stats={[
					fcs.fcsBalance > 0n
						? { value: `${amount(fcsValue)} ZCHF`, label: "value of your FCS at the current price", own: true }
						: { value: fcsPrice ? `${whole(fcsPrice)} ZCHF` : null, label: "price of one FCS" },
					...roeYears.map((y) => ({
						value: pct(y.roe, 1),
						label: y.complete ? `return on equity in ${y.year}` : `in ${y.year} so far, annualized`,
					})),
					{ value: roeAll === null ? null : pct(roeAll, 1), label: "a year since launch" },
				]}
			>
				<Action href="/equity" label={fcs.fcsBalance > 0n ? "Invest more" : "Get FCS"} event="overview_invest" />
				<div className="text-xs text-text-secondary text-center">Past performance. FCS can fall in value.</div>
			</Row>
		</div>
	);
}
