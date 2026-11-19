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
	/** [unix seconds, ZCHF held in all savings modules] weekly samples + the latest day */
	savings: [number, number][];
	/** annualized return on equity per calendar year, oldest first; the current year runs to today */
	roeYears: RoeYear[];
	/** [unix seconds, yearly rate as a fraction] in chronological order; a rate applies from its timestamp on. */
	rates: [number, number][];
	current: {
		rate: number | null;
		fpsPrice: number | null;
		roe12m: number | null;
		/** compound annual return on equity since the first daily log, same method as "All" on frankencoin.com */
		roeAll: number | null;
		totalSavings: number | null;
		updated: number | null;
	};
}

export interface RoeYear {
	year: number;
	/** unix seconds of the first and last day counted */
	from: number;
	to: number;
	roe: number;
	/** false for the running year */
	complete: boolean;
}

/** first calendar year with a full year of protocol history */
const ROE_FIRST_YEAR = 2024;

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
/** FCS price history starts after the launch phase (Oct 2023 – Apr 2024), when the price was set by the first capital coming in. */
const FPS_HISTORY_FROM_S = Date.UTC(2024, 4, 1) / 1000;
const YEAR_S = 365 * 86400;
const num = (v: string) => Number(BigInt(v)) / 1e18;

export async function loadCalcData(): Promise<CalcData> {
	const [logRes, rateRes] = await Promise.all([
		FRANKENCOIN_API_CLIENT.get<{ logs: DailyLog[] }>("/analytics/dailyLog/json"),
		FRANKENCOIN_API_CLIENT.get<{ list: Record<string, Record<string, RateEntry[]>> }>("/savings/leadrate/rates"),
	]);
	const logs = logRes.data.logs ?? [];
	const fps: [number, number][] = [];
	const savings: [number, number][] = [];
	let lastKept = -Infinity;
	let lastSavings = -Infinity;
	for (const l of logs) {
		const ts = Number(l.timestamp);
		if (ts - lastSavings >= WEEK_S) {
			savings.push([ts, num(l.totalSavings)]);
			lastSavings = ts;
		}
		if (ts < FPS_HISTORY_FROM_S) continue;
		if (ts - lastKept >= WEEK_S) {
			fps.push([ts, num(l.fpsPrice)]);
			lastKept = ts;
		}
	}
	const last = logs[logs.length - 1];
	const lastTs = last ? Number(last.timestamp) : null;
	if (last && fps[fps.length - 1]?.[0] !== lastTs) fps.push([lastTs as number, num(last.fpsPrice)]);
	if (last && savings[savings.length - 1]?.[0] !== lastTs) savings.push([lastTs as number, num(last.totalSavings)]);

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

	// Per calendar year, annualized: net income of the year over the average of its first and last equity,
	// scaled to a full year (mirrors the year buttons on frankencoin.com, src/utils/fcsStats.ts).
	const roeYears: RoeYear[] = [];
	if (logs.length) {
		const net = (l: DailyLog) => num(l.totalInflow) - num(l.totalOutflow);
		const nowS = Date.now() / 1000;
		for (let year = ROE_FIRST_YEAR; year <= new Date().getUTCFullYear(); year++) {
			const from = Date.UTC(year, 0, 1) / 1000;
			const to = Date.UTC(year + 1, 0, 1) / 1000;
			const slice = logs.filter((l) => Number(l.timestamp) >= from && Number(l.timestamp) < to);
			if (slice.length < 2) continue;
			const first = slice[0];
			const final = slice[slice.length - 1];
			const firstTs = Number(first.timestamp);
			const complete = to <= nowS;
			const end = complete ? Number(final.timestamp) : Math.min(nowS, to);
			const avgEquity = (num(first.totalEquity) + num(final.totalEquity)) / 2;
			const years = (end - firstTs) / YEAR_S;
			if (avgEquity <= 0 || years <= 0) continue;
			roeYears.push({ year, from: firstTs, to: end, roe: (net(final) - net(first)) / avgEquity / years, complete });
		}
	}

	// Since launch: cumulative net income over the average of first and last equity, as a compound annual rate
	// (mirrors readRoe("all") in the site's src/utils/fcsStats.ts).
	let roeAll: number | null = null;
	const first = logs[0];
	if (first && last && logs.length > 1) {
		const net = (l: DailyLog) => num(l.totalInflow) - num(l.totalOutflow);
		const avgEquity = (num(first.totalEquity) + num(last.totalEquity)) / 2;
		const years = (Date.now() / 1000 - Number(first.timestamp)) / YEAR_S;
		if (avgEquity > 0 && years > 0) roeAll = Math.pow(1 + (net(last) - net(first)) / avgEquity, 1 / years) - 1;
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
		savings,
		roeYears,
		rates,
		current: {
			rate: rates.length ? rates[rates.length - 1][1] : null,
			fpsPrice: last ? num(last.fpsPrice) : null,
			roe12m,
			roeAll,
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
	// FCS history starts after the launch phase; an earlier start is counted from the first real price.
	const partial = (data.fps[0]?.[0] ?? 0) > from;
	const f0 = Math.max(from, data.fps[0]?.[0] ?? from);
	const p0 = priceAt(data, f0);
	const shares = p0 > 0 ? amountChf / p0 : 0;
	for (let i = 0; i <= points; i++) curve.push(shares * priceAt(data, f0 + ((now - f0) * i) / points));
	const v = shares * (data.current.fpsPrice ?? priceAt(data, now));
	const roe = data.current.roe12m ?? 0;
	return finish(amountChf, v, curve, amountChf * Math.pow(1 + roe, years), partial);
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
