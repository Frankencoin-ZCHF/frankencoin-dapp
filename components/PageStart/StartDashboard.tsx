import Link from "next/link";
import { ReactNode, useState } from "react";
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
import AppTitle from "@components/AppTitle";
import { CHART_BLUE, CHART_GREEN, CollateralBars, Legend, TimeChart, YearBars, shortAmount as short } from "./StartChart";

const num = (wei: bigint) => Number(formatUnits(wei, 18));
const amount = (wei: bigint, digits = 2) => formatCurrency(formatUnits(wei, 18), digits, digits) ?? "0";
const whole = (v: number) => formatCurrency(Math.round(v), 0, 0) ?? "0";
const pct = (f: number, digits = 2) => `${(f * 100).toFixed(digits).replace(/\.?0+$/, "")}%`;
const MONTH_S = 30 * 86400;

interface Stat {
	// null while the figure is loading or cannot be read
	value: string | null;
	label: string;
}

interface PositionProps {
	label: string;
	value: string;
	unit: string;
	/** the product's one headline figure, e.g. the savings rate */
	badge: string | null;
	detail: ReactNode;
	/** a figure about this wallet, shown highlighted */
	own?: ReactNode;
	children: ReactNode;
}

/** One of the four tiles: what this wallet has in a product, and the way to more of it. */
function Position({ label, value, unit, badge, detail, own, children }: PositionProps) {
	return (
		<AppCard className="p-5 md:p-6 flex flex-col gap-5">
			<div className="flex items-center justify-between gap-3">
				<span className="text-xs tracking-wider font-bold text-text-secondary">{label.toUpperCase()}</span>
				<span className="rounded-full bg-card-content-primary px-2.5 py-1 text-xs font-semibold text-text-active whitespace-nowrap">
					{badge ?? "…"}
				</span>
			</div>
			<div>
				<div className="flex items-baseline gap-2 flex-wrap">
					<span
						className={`text-3xl md:text-4xl font-extrabold tabular-nums ${
							value == "—" ? "text-card-input-empty" : "text-text-primary"
						}`}
					>
						{value}
					</span>
					<span className="text-base font-bold text-text-secondary">{unit}</span>
				</div>
				<div className="mt-1 text-sm text-text-secondary">{detail}</div>
				{own ? <div className="mt-1 text-sm font-semibold text-text-success">{own}</div> : null}
			</div>
			<div className="mt-auto pt-4 border-t border-card-input-border flex flex-wrap items-center gap-x-4 gap-y-2">{children}</div>
		</AppCard>
	);
}

function Action({ href, label, event }: { href: string; label: string; event: string }) {
	return (
		<Link
			href={href}
			onClick={() => track(event)}
			className="rounded-lg bg-button-default px-4 py-2 text-sm font-semibold text-white hover:bg-button-hover"
		>
			{label}
		</Link>
	);
}

interface PanelProps {
	label: string;
	value: string | null;
	caption: string;
	legend?: { name: string; color: string; dashed?: boolean }[];
	/** shown instead of a legend, e.g. a switch between two views */
	aside?: ReactNode;
	stats?: Stat[];
	note?: string;
	children: ReactNode;
}

/** One protocol chart: the current figure as the headline, its history below, a few figures underneath. */
function Panel({ label, value, caption, legend, aside, stats, note, children }: PanelProps) {
	return (
		<AppCard className="p-5 md:p-6 flex flex-col gap-5 min-w-0">
			<div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
				<div>
					<div className="text-xs tracking-wider font-bold text-text-secondary">{label.toUpperCase()}</div>
					<div className="mt-1 flex items-baseline gap-2 flex-wrap">
						<span className="text-2xl font-extrabold text-text-primary tabular-nums">{value ?? "…"}</span>
						<span className="text-sm text-text-secondary">{caption}</span>
					</div>
				</div>
				{aside ?? (legend ? <Legend series={legend} /> : null)}
			</div>
			<div className="flex-1 min-w-0">{children}</div>
			{stats?.length ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 pt-4 border-t border-card-input-border">
					{stats.map((s) => (
						<div key={s.label}>
							<div className="font-bold text-text-primary tabular-nums">{s.value ?? "…"}</div>
							<div className="text-xs text-text-secondary">{s.label}</div>
						</div>
					))}
				</div>
			) : null}
			{note ? <div className="text-xs text-text-secondary">{note}</div> : null}
		</AppCard>
	);
}

/**
 * The overview: four tiles with this wallet's numbers (ZCHF held, savings, borrowing, FCS) and the action
 * that leads further, then one chart per product showing how the protocol itself is doing. Every figure is
 * read from the chain or the Frankencoin API; one that cannot be loaded shows "…" instead of an estimate.
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
	const roeYears = calc?.roeYears ?? [];
	const [fcsView, setFcsView] = useState<"price" | "roe">("price");
	const backingRatio = lastBacking ? lastBacking.collateral / lastBacking.supply : null;
	const collateralMap = useSelector((state: RootState) => state.ecosystem.collateralStats?.map ?? {});
	const collaterals = Object.values(collateralMap)
		.map((c) => ({ symbol: c.symbol, collateral: c.totalValueLocked?.chf ?? 0, minted: c.totalMinted ?? 0 }))
		.filter((c) => c.collateral > 0 && c.minted > 0)
		.sort((a, b) => b.collateral - a.collateral)
		.slice(0, 6);

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<Position
					label="You hold"
					value={dash ?? amount(zchf.total)}
					unit="ZCHF"
					badge={backingRatio === null ? null : `${pct(backingRatio, 0)} collateralized`}
					detail={isConnected ? "in your wallet, on all chains" : "Connect your wallet to see your balance"}
					own={
						zchf.total > 0n && saveRate
							? `+${whole(num(zchf.total) * saveRate)} ZCHF a year if you save it at today's ${pct(saveRate)}`
							: undefined
					}
				>
					<BuyZchf variant="inline" title={zchf.total > 0n ? "Buy more:" : "Buy ZCHF:"} source="overview" />
				</Position>

				<Position
					label="You are saving"
					value={dash ?? amount(saved + accrued)}
					unit="ZCHF"
					badge={saveRate ? `${pct(saveRate)} a year` : null}
					detail={
						!isConnected
							? "Interest accrues every block, withdraw any time"
							: accrued > 0n
							? `incl. ${amount(accrued)} ZCHF accrued interest`
							: saved > 0n
							? "No accrued interest yet"
							: "Nothing in savings yet"
					}
					own={yearly > 0n ? `+${amount(yearly)} ZCHF a year at today's rate` : undefined}
				>
					<Action href="/savings" label={saved > 0n ? "Deposit more" : "Start saving"} event="overview_save" />
				</Position>

				<Position
					label="You borrowed"
					value={dash ?? amount(my.minted)}
					unit="ZCHF"
					badge={
						my.rate !== null ? `${pct(my.rate)} a year, your average` : lowest === null ? null : `from ${pct(lowest)} a year`
					}
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
				>
					<Action href="/mint" label={mine.length > 0 ? "Borrow more" : "Borrow ZCHF"} event="overview_borrow" />
				</Position>

				<Position
					label="Your FCS"
					value={dash ?? amount(fcs.fcsBalance)}
					unit="FCS"
					badge={roeAll === null ? null : `${pct(roeAll, 1)} return on equity a year`}
					detail={
						!isConnected
							? "Frankencoin Shares, the protocol's equity"
							: fcs.fcsBalance > 0n
							? "Frankencoin Shares in your wallet"
							: "No Frankencoin Shares yet"
					}
					own={fcs.fcsBalance > 0n ? `worth ${amount(fcsValue)} ZCHF at the current price` : undefined}
				>
					<Action href="/equity" label={fcs.fcsBalance > 0n ? "Invest more" : "Get FCS"} event="overview_invest" />
				</Position>
			</div>

			<AppTitle title="How Frankencoin performs">
				<div className="text-text-secondary">The whole protocol, read from the chain and the Frankencoin API.</div>
			</AppTitle>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Panel
					label="Backing"
					value={backingRatio === null ? null : pct(backingRatio, 0)}
					caption="collateral value against all ZCHF in circulation"
					legend={[
						{ name: "Collateral value", color: CHART_GREEN },
						{ name: "ZCHF in circulation", color: CHART_BLUE },
					]}
					stats={[
						{ value: supply ? `${short(supply)} ZCHF` : null, label: "in circulation on eight chains" },
						{ value: collateralChf ? `${short(collateralChf)} ZCHF` : null, label: "collateral in open positions" },
					]}
				>
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
				</Panel>

				<Panel
					label="Savings"
					value={totalSaved ? `${short(totalSaved)} ZCHF` : null}
					caption="saved by all savers right now"
					legend={[
						{ name: "ZCHF in savings", color: CHART_BLUE },
						{ name: "Savings rate", color: CHART_GREEN, dashed: true },
					]}
					stats={[
						{ value: saveRate ? pct(saveRate) : null, label: "a year, set by governance" },
						{ value: paidOut ? `${short(paidOut)} ZCHF` : null, label: "interest paid to savers so far" },
					]}
				>
					<TimeChart
						series={[
							{ name: "ZCHF in savings", color: CHART_BLUE, data: savingsHistory, format: (v) => short(v) },
							{
								name: "Savings rate",
								color: CHART_GREEN,
								data: rateHistory,
								secondary: true,
								format: (v) => `${v.toFixed(1)}%`,
							},
						]}
					/>
				</Panel>

				<Panel
					label="Borrowing"
					value={all.minted > 0n ? `${short(num(all.minted))} ZCHF` : null}
					caption={open.length ? `borrowed across ${open.length} open positions` : "borrowed against collateral"}
					legend={[
						{ name: "ZCHF borrowed", color: CHART_BLUE },
						{ name: "Collateral locked", color: `${CHART_GREEN}73` },
					]}
					stats={[
						{ value: all.rate === null ? null : pct(all.rate), label: "a year, average on all open loans" },
						{ value: lowest === null ? null : pct(lowest), label: "a year, lowest on offer now" },
					]}
				>
					<CollateralBars rows={collaterals} />
				</Panel>

				<Panel
					label="Frankencoin Shares"
					value={fcsView == "price" ? (fcsPrice ? `${whole(fcsPrice)} ZCHF` : null) : roeAll === null ? null : pct(roeAll, 1)}
					caption={fcsView == "price" ? "price of one FCS" : "return on equity a year, since launch"}
					aside={
						<div className="flex rounded-lg bg-card-content-primary p-0.5 text-xs font-semibold">
							{(["price", "roe"] as const).map((v) => (
								<button
									key={v}
									type="button"
									aria-pressed={fcsView == v}
									onClick={() => {
										setFcsView(v);
										track("overview_fcs_view", { view: v });
									}}
									className={`rounded-md px-3 py-1.5 ${
										fcsView == v
											? "bg-card-body-primary text-text-active shadow-sm"
											: "text-text-secondary hover:text-text-primary"
									}`}
								>
									{v == "price" ? "Price" : "Return on equity"}
								</button>
							))}
						</div>
					}
					note={
						fcsView == "price"
							? "Price of one FCS in ZCHF."
							: "The protocol's net income in each year, divided by its equity (the reserve FCS holders own), as a yearly rate."
					}
				>
					{fcsView == "price" ? (
						<TimeChart
							series={[
								{ name: "FCS price", color: CHART_BLUE, data: priceHistory, fromZero: false, format: (v) => whole(v) },
							]}
						/>
					) : (
						<YearBars
							color={CHART_BLUE}
							format={(v) => `${v.toFixed(1)}%`}
							bars={roeYears.map((y) => ({
								label: y.complete ? String(y.year) : `${y.year} so far`,
								value: y.roe * 100,
								open: !y.complete,
							}))}
						/>
					)}
				</Panel>
			</div>
		</div>
	);
}
