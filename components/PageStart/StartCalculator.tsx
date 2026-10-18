import { useMemo, useState } from "react";
import { useCalcData } from "@hooks";
import { simulate, sparkline } from "../../utils/calculator";
import { formatCurrency } from "@utils";
import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";

export type CalcGoal = "save" | "invest";

interface Props {
	goal: CalcGoal;
	onGoalChange?: (g: CalcGoal) => void;
	/** Hide the goal switch (when the surrounding page already fixes the goal). */
	fixedGoal?: boolean;
	className?: string;
}

const PRESETS = [1000, 5000, 25000];
const YEARS = [1, 2, 3];

const pct = (f: number | null, digits = 2) => (f === null ? "—" : `${(f * 100).toFixed(digits).replace(/\.?0+$/, "")}%`);
const chf = (v: number) => `${formatCurrency(Math.round(v), 0, 0)} ZCHF`;

/**
 * "What if" calculator: what X ZCHF put into savings or FCS N years ago would be worth today, using the
 * protocol's recorded history, plus a projection at today's rate. Same maths as frankencoin.com/start.
 */
export default function StartCalculator({ goal, onGoalChange, fixedGoal = false, className }: Props) {
	const { data, error } = useCalcData();
	const [amount, setAmount] = useState(5000);
	const [years, setYears] = useState(1);

	const r = useMemo(() => (data ? simulate(data, goal, amount, years) : null), [data, goal, amount, years]);
	const spark = useMemo(() => (r ? sparkline(r.curve) : { line: "", area: "" }), [r]);

	const hint = (g: CalcGoal) =>
		g === "save" ? `${pct(data?.current.rate ?? null)} a year · withdraw any time` : "Equity of the protocol · price can fall";

	return (
		<AppCard className={`p-4 md:p-6 flex flex-col gap-4 ${className ?? ""}`}>
			<div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
				<div className="flex flex-col gap-4 min-w-0">
					{!fixedGoal && (
						<div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-card-content-primary" role="tablist">
							{(["save", "invest"] as CalcGoal[]).map((g) => (
								<button
									key={g}
									type="button"
									role="tab"
									aria-selected={goal === g}
									onClick={() => onGoalChange?.(g)}
									className={`rounded-lg px-3 py-3 text-left transition-colors min-w-0 ${
										goal === g
											? "bg-card-body-primary shadow-sm text-text-primary"
											: "text-text-secondary hover:text-text-primary"
									}`}
								>
									<span className="block font-bold">{g === "save" ? "Save in Swiss francs" : "Invest in FCS"}</span>
									<span className="block text-xs mt-0.5 text-text-secondary leading-snug">{hint(g)}</span>
								</button>
							))}
						</div>
					)}

					<label className="flex flex-col gap-1 min-w-0">
						<span className="text-xs tracking-wider font-bold text-card-input-label">AMOUNT</span>
						<span className="flex min-w-0 rounded-xl border border-card-input-border overflow-hidden focus-within:border-card-input-focus">
							<input
								type="text"
								inputMode="decimal"
								size={6}
								className="w-full min-w-0 flex-1 px-4 py-3 text-2xl font-bold text-text-primary outline-none bg-transparent"
								value={formatCurrency(amount, 0, 0) ?? ""}
								onChange={(e) => {
									const n = Number(e.target.value.replace(/[^\d.]/g, ""));
									setAmount(Number.isFinite(n) && n > 0 ? Math.min(n, 1e9) : 0);
								}}
							/>
							<span className="px-4 flex items-center font-bold bg-card-content-primary text-text-primary border-l border-card-input-border">
								ZCHF
							</span>
						</span>
					</label>
					<div className="flex flex-wrap gap-2 -mt-2">
						{PRESETS.map((p) => (
							<button
								key={p}
								type="button"
								onClick={() => setAmount(p)}
								className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
									amount === p
										? "border-text-primary bg-text-primary text-white"
										: "border-card-input-border text-text-secondary hover:border-text-primary"
								}`}
							>
								{formatCurrency(p, 0, 0)}
							</button>
						))}
					</div>

					<div className="flex flex-col gap-1">
						<span className="text-xs tracking-wider font-bold text-card-input-label">IF YOU HAD STARTED</span>
						<div className="grid grid-cols-3 gap-2">
							{YEARS.map((y) => (
								<button
									key={y}
									type="button"
									onClick={() => setYears(y)}
									className={`rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${
										years === y
											? "border-text-primary bg-text-primary text-white"
											: "border-card-input-border text-text-secondary hover:border-text-primary"
									}`}
								>
									{y} {y === 1 ? "year" : "years"} ago
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-3 min-w-0">
					<div className="rounded-2xl bg-card-body-secondary text-white p-5 relative overflow-hidden">
						<p className="text-xs tracking-wider font-bold opacity-80">YOU WOULD HAVE TODAY</p>
						<p className="text-[34px] sm:text-[44px] font-black mt-1 leading-none break-words">
							{r ? chf(r.now) : error ? "—" : "…"}
						</p>
						{r && (
							<p className="text-sm mt-2 opacity-90">
								Started with {chf(r.start)} · Gain{" "}
								<span className={`font-bold ${r.gainPct >= 0 ? "text-[#7ee2a8]" : "text-[#ff9a9a]"}`}>
									{r.gainPct >= 0 ? "+" : "−"}
									{Math.abs(r.gainPct * 100).toFixed(1)}%
								</span>
							</p>
						)}
						<svg viewBox="0 0 100 32" preserveAspectRatio="none" className="w-full h-16 mt-4 opacity-90" aria-hidden="true">
							<path d={spark.area} fill="rgba(255,255,255,0.14)" />
							<path d={spark.line} fill="none" stroke="#ffffff" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
						</svg>
					</div>
					<div className="rounded-2xl border border-card-input-border p-4">
						<p className="text-xs tracking-wider font-bold text-card-input-label">
							IN {years} {years === 1 ? "YEAR" : "YEARS"} AT TODAY&apos;S {goal === "save" ? "RATE" : "RETURN"}
						</p>
						<p className="text-2xl font-black text-text-primary mt-1">{r ? chf(r.projected) : "…"}</p>
						<p className="text-xs text-text-secondary mt-1">
							Projection only repeats today&apos;s figure. Nothing here is investment advice.
						</p>
					</div>
					<p className="text-xs text-text-secondary leading-snug">
						{goal === "save"
							? "Based on the savings rate the protocol actually paid since the savings module launched. Interest compounds daily."
							: "Based on the FCS share price (FPS valuation) recorded on-chain each day. Past performance is no guarantee."}
						{r?.partial && goal === "save" && data?.rates[0] && (
							<>
								{" "}
								Savings started in{" "}
								{new Date(data.rates[0][0] * 1000).toLocaleDateString("en-CH", { month: "long", year: "numeric" })}; earlier
								months are shown without interest.
							</>
						)}{" "}
						<AppLink className="" label="Same calculator on frankencoin.com" href="https://frankencoin.com/start" external />
					</p>
				</div>
			</div>
		</AppCard>
	);
}
