/**
 * "What if" calculator maths, shared by /start and the Savings/Invest pre-connect cards.
 * Mirrors src/utils/calcStats.ts + Calculator.astro on frankencoin.com so both show the same numbers.
 *
 * All values are in ZCHF (= CHF). Fiat conversion happens only when displaying.
 */
import { FRANKENCOIN_API_CLIENT } from "../app.config";

export interface CalcData {
	/** [unix seconds, FPS price in ZCHF] weekly samples + the latest day. FCS is priced at the FPS valuation. */
	fps: [number, number][];
	/** [unix seconds, yearly rate as a fraction] in chronological order; a rate applies from its timestamp on. */
	rates: [number, number][];
	current: { rate: number | null; fpsPrice: number | null; roe12m: number | null; totalSavings: number | null; updated: number | null };
}

interface DailyLog {
	timestamp: string;
	fpsPrice: string;
	totalSavings: string;
	totalEquity: string;
	totalInflow: string;
	totalOutflow: string;
}
interface RateEntry {
	created: number;
	approvedRate: number;
}

const WEEK_S = 7 * 86400;
const YEAR_S = 365 * 86400;
const num = (v: string) => Number(BigInt(v)) / 1e18;

export async function loadCalcData(): Promise<CalcData> {
	const [logRes, rateRes] = await Promise.all([
		FRANKENCOIN_API_CLIENT.get<{ logs: DailyLog[] }>("/analytics/dailyLog/json"),
		FRANKENCOIN_API_CLIENT.get<{ list: Record<string, Record<string, RateEntry[]>> }>("/savings/leadrate/rates"),
	]);
	const logs = logRes.data.logs ?? [];
	const fps: [number, number][] = [];
	let lastKept = -Infinity;
	for (const l of logs) {
		const ts = Number(l.timestamp);
		if (ts - lastKept >= WEEK_S) {
			fps.push([ts, num(l.fpsPrice)]);
			lastKept = ts;
		}
	}
	const last = logs[logs.length - 1];
	const lastTs = last ? Number(last.timestamp) : null;
	if (last && fps[fps.length - 1]?.[0] !== lastTs) fps.push([lastTs as number, num(last.fpsPrice)]);

	// Trailing-12-month realised earnings over average equity, as in EquityFPSDetailsCard.
	let roe12m: number | null = null;
	if (last && lastTs) {
		const start = logs.find((l) => Number(l.timestamp) >= lastTs - YEAR_S);
		if (start) {
			const net = (l: DailyLog) => num(l.totalInflow) - num(l.totalOutflow);
			const avgEquity = (num(start.totalEquity) + num(last.totalEquity)) / 2;
			roe12m = avgEquity > 0 ? (net(last) - net(start)) / avgEquity : null;
		}
	}

	// Mainnet savings modules; a newer module supersedes older ones from its first rate on.
	const modules = Object.values(rateRes.data.list?.["1"] ?? {})
		.map((e) => [...e].sort((a, b) => a.created - b.created))
		.filter((e) => e.length)
		.sort((a, b) => a[0].created - b[0].created);
	const rates: [number, number][] = [];
	modules.forEach((m, i) => {
		const nextStart = modules[i + 1]?.[0].created ?? Infinity;
		for (const e of m) if (e.created < nextStart) rates.push([e.created, e.approvedRate / 1_000_000]);
	});
	rates.sort((a, b) => a[0] - b[0]);

	return {
		fps,
		rates,
		current: {
			rate: rates.length ? rates[rates.length - 1][1] : null,
			fpsPrice: last ? num(last.fpsPrice) : null,
			roe12m,
			totalSavings: last ? num(last.totalSavings) : null,
			updated: lastTs,
		},
	};
}

export function rateAt(data: CalcData, ts: number): number {
	let r = 0;
	for (const [t, v] of data.rates) {
		if (t <= ts) r = v;
		else break;
	}
	return r;
}

export function priceAt(data: CalcData, ts: number): number {
	const s = data.fps;
	if (!s.length) return 0;
	let p = s[0][1];
	for (const [t, v] of s) {
		if (t <= ts) p = v;
		else break;
	}
	return p;
}

export interface CalcResult {
	start: number;
	now: number;
	gainPct: number;
	projected: number;
	/** growth curve, N+1 points from start to now */
	curve: number[];
	/** true when part of the period predates the history (savings module launch / first FPS price) */
	partial: boolean;
}

export function simulate(data: CalcData, goal: "save" | "invest", amountChf: number, years: number, points = 48): CalcResult {
	const now = data.current.updated ?? Math.floor(Date.now() / 1000);
	const from = now - years * YEAR_S;
	const curve: number[] = [];
	if (goal === "save") {
		let v = amountChf;
		const step = (now - from) / points;
		curve.push(v);
		for (let i = 1; i <= points; i++) {
			const a = from + (i - 1) * step;
			const b = from + i * step;
			for (let t = a; t < b; t += 86400) v *= 1 + (rateAt(data, t) * Math.min(86400, b - t)) / YEAR_S;
			curve.push(v);
		}
		const cur = data.current.rate ?? 0;
		return finish(amountChf, v, curve, amountChf * Math.pow(1 + cur, years), rateAt(data, from) === 0);
	}
	const p0 = priceAt(data, from);
	const shares = p0 > 0 ? amountChf / p0 : 0;
	for (let i = 0; i <= points; i++) curve.push(shares * priceAt(data, from + ((now - from) * i) / points));
	const v = shares * (data.current.fpsPrice ?? priceAt(data, now));
	const roe = data.current.roe12m ?? 0;
	return finish(amountChf, v, curve, amountChf * Math.pow(1 + roe, years), (data.fps[0]?.[0] ?? 0) > from);
}

function finish(start: number, now: number, curve: number[], projected: number, partial: boolean): CalcResult {
	return { start, now, gainPct: start ? now / start - 1 : 0, projected, curve, partial };
}

/** SVG path for a 100x32 viewBox sparkline plus its filled area. */
export function sparkline(curve: number[]): { line: string; area: string } {
	if (curve.length < 2) return { line: "", area: "" };
	const min = Math.min(...curve);
	const max = Math.max(...curve);
	const span = max - min || 1;
	const line = curve
		.map((v, i) => `${i ? "L" : "M"}${((i / (curve.length - 1)) * 100).toFixed(2)} ${(30 - ((v - min) / span) * 26).toFixed(2)}`)
		.join(" ");
	return { line, area: `${line} L100 32 L0 32 Z` };
}
