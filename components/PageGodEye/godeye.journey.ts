import { GodEyeJourney, GodEyeKind, GodEyeTimelinePoint } from "./godeye.types";

export type PeerStat = {
	i: number;
	address: string;
	label: string | null;
	kind: GodEyeKind;
	in: number;
	out: number;
	count: number;
	first: number;
	last: number;
};

export type JourneyModel = {
	journey: GodEyeJourney;
	t0: number;
	t1: number;
	/** the shape the shared timeline scrubber expects: supply = balance, holders = counterparties, volume = in + out */
	series: GodEyeTimelinePoint[];
	/** whole-history totals per peer (drives the layout) */
	totals: PeerStat[];
};

export type JourneyState = {
	/** index of the last day <= cursor, -1 before the first transfer */
	day: number;
	balance: number;
	inflow: number;
	outflow: number;
	txs: number;
	peers: PeerStat[];
	byKind: Map<GodEyeKind, number>;
};

export function buildModel(journey: GodEyeJourney): JourneyModel {
	const totals: PeerStat[] = journey.peers.map((p, i) => ({ i, ...p, in: 0, out: 0, count: 0, first: Infinity, last: 0 }));
	const seen = new Set<number>();
	const series: GodEyeTimelinePoint[] = journey.days.map((d) => {
		for (const p of d.peers) {
			const s = totals[p.i];
			s.in += p.in;
			s.out += p.out;
			s.count += p.count;
			s.first = Math.min(s.first, d.t);
			s.last = Math.max(s.last, d.t);
			seen.add(p.i);
		}
		return { t: d.t, supply: Math.max(d.balance, 0), holders: seen.size, volume: d.in + d.out, minted: d.in, burned: d.out, transfers: d.txs };
	});
	return { journey, t0: series[0]?.t ?? 0, t1: series[series.length - 1]?.t ?? 0, series, totals };
}

/** index of the last day with t <= cur */
export function dayAt(model: JourneyModel, cur: number): number {
	const d = model.journey.days;
	let lo = 0,
		hi = d.length - 1,
		r = -1;
	while (lo <= hi) {
		const m = (lo + hi) >> 1;
		if (d[m].t <= cur) (r = m), (lo = m + 1);
		else hi = m - 1;
	}
	return r;
}

export function stateAt(model: JourneyModel, cur: number): JourneyState {
	const { journey } = model;
	const day = dayAt(model, cur);
	const acc = new Map<number, PeerStat>();
	let inflow = 0,
		outflow = 0,
		txs = 0;
	for (let k = 0; k <= day; k++) {
		const d = journey.days[k];
		inflow += d.in;
		outflow += d.out;
		txs += d.txs;
		for (const p of d.peers) {
			let s = acc.get(p.i);
			if (!s) acc.set(p.i, (s = { ...model.totals[p.i], in: 0, out: 0, count: 0, first: d.t, last: d.t }));
			s.in += p.in;
			s.out += p.out;
			s.count += p.count;
			s.last = d.t;
		}
	}
	const peers = [...acc.values()].sort((a, b) => b.in + b.out - (a.in + a.out));
	const byKind = new Map<GodEyeKind, number>();
	for (const p of peers) byKind.set(p.kind, (byKind.get(p.kind) ?? 0) + p.in + p.out);
	return { day, balance: day >= 0 ? journey.days[day].balance : 0, inflow, outflow, txs, peers, byKind };
}

export type Insight = { title: string; value: string; sub?: string; tone?: "good" | "bad" };

export function insights(model: JourneyModel, fmt: (n: number) => string, dateStr: (t: number) => string): Insight[] {
	const days = model.journey.days;
	if (!days.length) return [];
	const out: Insight[] = [];

	let peak = days[0];
	let busiest = days[0];
	let biggest = days[0];
	for (const d of days) {
		if (d.balance > peak.balance) peak = d;
		if (d.txs > busiest.txs) busiest = d;
		if (d.in + d.out > biggest.in + biggest.out) biggest = d;
	}
	out.push({ title: "Peak balance", value: fmt(peak.balance), sub: dateStr(peak.t) });
	out.push({ title: "Biggest day", value: fmt(biggest.in + biggest.out), sub: `${dateStr(biggest.t)} · ${fmt(biggest.in)} in / ${fmt(biggest.out)} out` });
	out.push({ title: "Busiest day", value: `${busiest.txs.toLocaleString()} transfers`, sub: dateStr(busiest.t) });

	let gap = 0,
		gapAt = days[0].t;
	for (let i = 1; i < days.length; i++) {
		const g = days[i].t - days[i - 1].t;
		if (g > gap) (gap = g), (gapAt = days[i - 1].t);
	}
	const sinceLast = Date.now() / 1000 - days[days.length - 1].t;
	if (gap > 0) out.push({ title: "Longest quiet period", value: `${Math.round(gap / 86400)} days`, sub: `from ${dateStr(gapAt)}` });
	out.push({
		title: "Last activity",
		value: sinceLast < 86400 * 2 ? "today" : `${Math.round(sinceLast / 86400)} days ago`,
		sub: dateStr(days[days.length - 1].t),
	});

	const span = Math.max(1, Math.round((model.t1 - model.t0) / 86400) + 1);
	out.push({ title: "Active days", value: `${days.length} / ${span}`, sub: `${((days.length / span) * 100).toFixed(1)}% of its lifetime` });

	const first = [...days[0].peers].sort((a, b) => b.in - a.in)[0];
	if (first && first.in > 0) {
		const p = model.journey.peers[first.i];
		out.push({ title: "First funded by", value: p.label || p.address.slice(0, 6) + "…" + p.address.slice(-4), sub: `${fmt(first.in)} on ${dateStr(days[0].t)}` });
	}

	const tin = model.totals.reduce((s, p) => s + p.in, 0);
	const tout = model.totals.reduce((s, p) => s + p.out, 0);
	const topIn = [...model.totals].sort((a, b) => b.in - a.in)[0];
	const topOut = [...model.totals].sort((a, b) => b.out - a.out)[0];
	if (topIn && tin > 0) out.push({ title: "Main source", value: `${((topIn.in / tin) * 100).toFixed(0)}% of inflow`, sub: topIn.label || topIn.address.slice(0, 10) + "…" });
	if (topOut && tout > 0) out.push({ title: "Main destination", value: `${((topOut.out / tout) * 100).toFixed(0)}% of outflow`, sub: topOut.label || topOut.address.slice(0, 10) + "…" });
	return out;
}
