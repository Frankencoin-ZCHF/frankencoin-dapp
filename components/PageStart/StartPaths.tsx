import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ADDRESS } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import { formatCurrency, normalizeAddress } from "@utils";
import { useCalcData } from "@hooks";
import { track } from "../../hooks/useAnalytics";
import type { CalcGoal } from "./StartCalculator";

interface Props {
	goal: CalcGoal;
	onGoalChange: (g: CalcGoal) => void;
}

/** The three ways in, each with the one number that matters. Earn and Invest also drive the calculator below. */
export default function StartPaths({ goal, onGoalChange }: Props) {
	const { status } = useSelector((state: RootState) => state.savings.savingsInfo);
	const fpsInfo = useSelector((state: RootState) => state.ecosystem.fpsInfo);
	const { data } = useCalcData();

	const savingsAddress = normalizeAddress(ADDRESS[mainnet.id].savingsReferral);
	const rate = (status[mainnet.id]?.[savingsAddress]?.rate ?? 0) / 10000;
	const roe = data?.current.roe12m ?? null;
	const fpsPrice = fpsInfo?.token?.price ?? data?.current.fpsPrice ?? 0;

	const cards: {
		key: CalcGoal | "borrow";
		eyebrow: string;
		title: string;
		stat: string;
		statLabel: string;
		body: string;
		cta: string;
		href: string;
	}[] = [
		{
			key: "save",
			eyebrow: "Lower risk",
			title: "Earn",
			stat: rate ? `${rate.toFixed(2).replace(/\.?0+$/, "")}%` : "…",
			statLabel: "a year, withdraw any time",
			body: "Deposit ZCHF in the savings module. Interest accrues every block, no lock-up.",
			cta: "Start saving",
			href: "/savings",
		},
		{
			key: "invest",
			eyebrow: "Higher risk, higher upside",
			title: "Invest",
			stat: roe === null ? "…" : `${(roe * 100).toFixed(1)}%`,
			statLabel: `return on equity, last 12 months · FCS ${formatCurrency(fpsPrice, 0, 0)} ZCHF`,
			body: "Buy Frankencoin Shares (FCS): a share of the reserve that collects every minter's fees, plus a vote.",
			cta: "Get FCS",
			href: "/equity",
		},
		{
			key: "borrow",
			eyebrow: "For holders of crypto, gold or shares",
			title: "Borrow",
			stat: "0%",
			statLabel: "minimum rate from 1.1% a year, you pick the terms",
			body: "Mint ZCHF against BTC, ETH, tokenized gold or Swiss shares and keep your exposure.",
			cta: "See collateral",
			href: "/mint",
		},
	];
	cards[2].stat = "1.1%+";

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			{cards.map((c) => {
				const selected = c.key === goal;
				return (
					<div
						key={c.key}
						onClick={() => c.key !== "borrow" && onGoalChange(c.key as CalcGoal)}
						className={`flex flex-col gap-2 rounded-lg p-5 border bg-card-body-primary transition-colors ${
							c.key !== "borrow" ? "cursor-pointer" : ""
						} ${selected ? "border-card-input-focus shadow-sm" : "border-card-input-border hover:border-card-input-hover"}`}
					>
						<span className="text-xs tracking-wider font-bold text-card-input-focus">{c.eyebrow.toUpperCase()}</span>
						<span className="text-2xl font-black text-text-primary">{c.title}</span>
						<span className="flex items-baseline gap-2 flex-wrap">
							<span className="text-3xl font-black text-text-primary">{c.stat}</span>
							<span className="text-xs text-text-secondary">{c.statLabel}</span>
						</span>
						<p className="text-sm text-text-secondary flex-1">{c.body}</p>
						<Link
							href={c.href}
							onClick={(e) => {
								e.stopPropagation();
								track(`start_path_${c.key}`);
							}}
							className="mt-2 inline-flex items-center justify-center rounded-lg bg-button-default text-white font-semibold px-4 py-2.5 hover:bg-button-hover transition-colors"
						>
							{c.cta}
						</Link>
					</div>
				);
			})}
		</div>
	);
}
