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
import { track, useCalcData, useFCSStats, useSavingsAccounts, useUsdChfSince, useZchfWalletBalance } from "@hooks";

const amount = (wei: bigint, digits = 2) => formatCurrency(formatUnits(wei, 18), digits, digits) ?? "0";
const whole = (v: number) => formatCurrency(Math.round(v), 0, 0) ?? "0";
const pct = (f: number, digits = 2) => `${(f * 100).toFixed(digits).replace(/\.?0+$/, "")}%`;

interface TileProps {
	label: string;
	value: string;
	unit: string;
	detail: ReactNode;
	stat: string | null;
	statText: ReactNode;
	children: ReactNode;
}

function Tile({ label, value, unit, detail, stat, statText, children }: TileProps) {
	return (
		<AppCard className="p-5 flex flex-col gap-3 min-w-0">
			<div className="text-xs tracking-wider font-bold text-text-secondary">{label.toUpperCase()}</div>
			<div className="min-w-0">
				<div className="flex items-baseline gap-2 flex-wrap">
					<span className="text-2xl font-extrabold text-text-primary tabular-nums">{value}</span>
					<span className="font-bold text-text-secondary">{unit}</span>
				</div>
				<div className="text-sm text-text-secondary min-h-[1.25rem]">{detail}</div>
			</div>
			<div className="rounded-lg bg-card-content-primary p-3 flex-1">
				<div className="text-xl font-black text-text-primary tabular-nums">{stat ?? "…"}</div>
				<div className="text-xs text-text-secondary leading-snug mt-0.5">{statText}</div>
			</div>
			<div className="flex flex-col gap-2">{children}</div>
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
 * The four numbers a returning user cares about (ZCHF held, savings, borrowing, FCS), each next to one
 * figure about the product and the action that leads further. Every figure is read from the chain, the
 * Frankencoin API or ECB reference rates; a figure that cannot be loaded shows "…" instead of an estimate.
 */
export default function StartDashboard() {
	const { address, isConnected } = useConnection();
	const account = address ?? zeroAddress;
	const dash = isConnected ? undefined : "—";

	// ZCHF in the wallet, all chains
	const zchf = useZchfWalletBalance();
	const fx = useUsdChfSince();

	// savings on all chains
	const { accounts } = useSavingsAccounts(account);
	const saved = accounts.reduce((s, a) => s + a.saved, 0n);
	const accrued = accounts.reduce((s, a) => s + a.netInterest, 0n);
	const { status, totalInterest } = useSelector((state: RootState) => state.savings.savingsInfo);
	const saveRatePPM = status?.[mainnet.id]?.[normalizeAddress(ADDRESS[mainnet.id].savingsReferral)]?.rate ?? 0;
	const paidOut = typeof totalInterest == "number" ? totalInterest : 0;

	// borrowing: open positions with debt, across the protocol and for this owner
	const positions = useSelector((state: RootState) => state.positions.list.list);
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const open = positions.filter((p) => !p.closed && !p.denied && BigInt(p.minted) > 0n);
	const totalMinted = open.reduce((s, p) => s + BigInt(p.minted), 0n);
	const avgRate =
		totalMinted > 0n
			? Number(open.reduce((s, p) => s + BigInt(p.minted) * BigInt(p.annualInterestPPM), 0n) / totalMinted) / 1_000_000
			: null;
	const mine = isConnected ? open.filter((p) => normalizeAddress(p.owner) == normalizeAddress(account)) : [];
	const myMinted = mine.reduce((s, p) => s + BigInt(p.minted), 0n);
	const myCollateral = mine.reduce((s, p) => {
		const price = prices?.[normalizeAddress(p.collateral)]?.price?.chf;
		return price ? s + Number(formatUnits(BigInt(p.collateralBalance), p.collateralDecimals)) * price : s;
	}, 0);

	// FCS
	const fcs = useFCSStats();
	const fcsValue = (fcs.fcsAsk * fcs.fcsBalance) / 10n ** 18n;
	const { data: calc } = useCalcData();
	const roeAll = calc?.current.roeAll ?? null;
	const roe12m = calc?.current.roe12m ?? null;

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
			<Tile
				label="You hold"
				value={dash ?? amount(zchf.total)}
				unit="ZCHF"
				detail={isConnected ? "in your wallet, on all chains" : "Connect your wallet to see your balance"}
				stat={fx ? `${fx.change < 0 ? "−" : "+"}${pct(Math.abs(fx.change), 1)}` : null}
				statText={
					fx ? (
						<>
							US dollar against the Swiss franc since January 2023. 10 000 USD moved into francs then are worth{" "}
							{whole((10000 * fx.start) / fx.now)} USD today. ECB reference rates.
						</>
					) : (
						"US dollar against the Swiss franc since January 2023"
					)
				}
			>
				<BuyZchf variant="inline" title={zchf.total > 0n ? "Buy more:" : "Buy ZCHF:"} source="overview" />
			</Tile>

			<Tile
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
				stat={saveRatePPM ? `${pct(saveRatePPM / 1_000_000)} a year` : null}
				statText={
					<>
						Current savings rate, withdraw any time.
						{paidOut > 0 ? ` ${whole(paidOut)} ZCHF interest paid to savers so far.` : ""}
					</>
				}
			>
				<Action href="/savings" label={saved > 0n ? "Deposit more" : "Start saving"} event="overview_save" />
			</Tile>

			<Tile
				label="You borrowed"
				value={dash ?? amount(myMinted)}
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
				stat={avgRate === null ? null : `${pct(avgRate)} a year`}
				statText={
					avgRate === null
						? "Average interest on all open loans"
						: `Average interest on the ${whole(Number(formatUnits(totalMinted, 18)))} ZCHF borrowed across ${
								open.length
						  } open positions, weighted by amount.`
				}
			>
				<Action href="/mint" label={mine.length > 0 ? "Borrow more" : "Borrow ZCHF"} event="overview_borrow" />
			</Tile>

			<Tile
				label="Your FCS"
				value={dash ?? amount(fcs.fcsBalance)}
				unit="FCS"
				detail={
					!isConnected
						? "Frankencoin Shares, the protocol's equity"
						: fcs.fcsBalance > 0n
						? `worth ${amount(fcsValue)} ZCHF at the current price`
						: "No Frankencoin Shares yet"
				}
				stat={roeAll === null ? null : `${pct(roeAll, 1)} a year`}
				statText={
					<>
						Return on equity since launch, annualized{roe12m === null ? "" : `; ${pct(roe12m, 1)} over the last 12 months`}.
						Past performance, FCS can fall in value.
					</>
				}
			>
				<Action href="/equity" label={fcs.fcsBalance > 0n ? "Invest more" : "Get FCS"} event="overview_invest" />
			</Tile>
		</div>
	);
}
