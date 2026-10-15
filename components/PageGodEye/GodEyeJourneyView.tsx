import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGodEyeBoot, useGodEyeJourney } from "../../hooks/useGodEye";
import { EXPLORER, KIND_META } from "./godeye.constants";
import { GodEyeKind } from "./godeye.types";
import { dateStr, fmt, pct, shortAddr } from "./godeye.format";
import { buildModel, insights, stateAt } from "./godeye.journey";
import GodEyeJourneyCanvas, { JourneyCanvasHandle } from "./GodEyeJourneyCanvas";
import GodEyeLoading from "./GodEyeLoading";
import GodEyeTimeline from "./GodEyeTimeline";
import { Dot, Glass, IconButton, SectionTitle, StatCard } from "./GodEyeUi";

const NEAR_LIVE = 86400;
const LABELS = { supply: "Balance", holders: "Counterparties", volume: "Volume" };

function useIsWide() {
	const [wide, setWide] = useState(true);
	useEffect(() => {
		const mq = window.matchMedia("(min-width: 1024px)");
		const on = () => setWide(mq.matches);
		on();
		mq.addEventListener("change", on);
		return () => mq.removeEventListener("change", on);
	}, []);
	return wide;
}

export default function GodEyeJourneyView() {
	const router = useRouter();
	const boot = useGodEyeBoot();
	const wide = useIsWide();
	const canvas = useRef<JourneyCanvasHandle>(null);

	const address = router.isReady ? String(router.query.address ?? "").toLowerCase() : null;
	const [token, setToken] = useState<string | null>(null);
	const [at, setAt] = useState<number | null>(null);
	const [selected, setSelected] = useState<number | null>(null);
	const [playing, setPlaying] = useState(false);
	const [rate, setRate] = useState(2592000);
	const [fitKey, setFitKey] = useState(0);
	const [hashRead, setHashRead] = useState(false);
	const [top, setTop] = useState(50);
	const [topLocal, setTopLocal] = useState(50);
	const [hidden, setHidden] = useState<Set<GodEyeKind>>(new Set());
	const toggleKind = (k: GodEyeKind) =>
		setHidden((h) => {
			const n = new Set(h);
			n.has(k) ? n.delete(k) : n.add(k);
			return n;
		});

	// token comes from the link, otherwise default to ZCHF once the ledger is ready
	useEffect(() => {
		if (!router.isReady || !boot.ready) return;
		const q = router.query.token ? String(router.query.token) : null;
		const t = q && boot.tokens.some((x) => x.key === q) ? q : (boot.tokens.find((x) => x.symbol === "ZCHF" && x.chainId === 1) ?? boot.tokens[0]).key;
		setToken((cur) => cur ?? t);
	}, [router.isReady, router.query.token, boot.ready, boot.tokens]);

	const { data: journey, loading, error } = useGodEyeJourney(boot.ready ? token : null, address);
	const model = useMemo(() => (journey ? buildModel(journey) : null), [journey]);

	// cursor + selection from the hash, once the data is there
	useEffect(() => {
		if (!model || hashRead) return;
		const p = new URLSearchParams(window.location.hash.slice(1));
		if (p.get("at")) setAt(Number(p.get("at")));
		if (p.get("sel")) {
			const i = model.journey.peers.findIndex((x) => x.address === p.get("sel"));
			if (i >= 0) setSelected(i);
		}
		setHashRead(true);
	}, [model, hashRead]);
	useEffect(() => {
		if (!model || !hashRead) return;
		const t = setTimeout(() => {
			const p = new URLSearchParams();
			if (at) p.set("at", String(at));
			if (selected !== null) p.set("sel", model.journey.peers[selected].address);
			try {
				window.history.replaceState(null, "", window.location.pathname + window.location.search + (p.toString() ? "#" + p.toString() : ""));
			} catch {
				/* ignore */
			}
		}, 400);
		return () => clearTimeout(t);
	}, [model, hashRead, at, selected]);

	const t0 = model?.t0 ?? 0;
	const t1 = model?.t1 ?? 0;
	const cur = at ?? t1;

	// ---- time travel (same feel as the map: scrub, play, live)
	const scrub = useCallback(
		(t: number) => {
			setPlaying(false);
			setAt(t >= t1 - NEAR_LIVE ? null : Math.floor(t));
		},
		[t1]
	);
	const togglePlay = useCallback(() => {
		setPlaying((p) => {
			if (!p && (!at || at >= t1 - NEAR_LIVE)) setAt(t0);
			return !p;
		});
	}, [at, t0, t1]);
	useEffect(() => {
		if (!playing) return;
		const i = setInterval(() => {
			setAt((c) => {
				const next = (c ?? t1) + rate * 0.1;
				if (next >= t1) {
					setPlaying(false);
					return null;
				}
				return Math.floor(next);
			});
		}, 100);
		return () => clearInterval(i);
	}, [playing, rate, t1]);

	const state = useMemo(() => (model ? stateAt(model, cur) : null), [model, cur]);
	const now = useMemo(() => new Map((state?.peers ?? []).map((p) => [p.i, p])), [state]);
	const kinds = useMemo(() => {
		const v = new Map<GodEyeKind, number>();
		for (const p of model?.totals ?? []) v.set(p.kind, (v.get(p.kind) ?? 0) + p.in + p.out);
		return [...v.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
	}, [model]);
	const facts = useMemo(() => (model ? insights(model, fmt, dateStr) : []), [model]);

	useEffect(() => {
		const key = (e: KeyboardEvent) => {
			if (["INPUT", "SELECT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;
			if (e.code === "Space") {
				e.preventDefault();
				togglePlay();
			} else if (e.key === "f" || e.key === "F") canvas.current?.fit();
			else if (e.key === "Escape") setSelected(null);
			else if (e.key === "ArrowLeft" || e.key === "ArrowRight") scrub(cur + (e.key === "ArrowRight" ? 1 : -1) * 86400 * 7);
		};
		window.addEventListener("keydown", key);
		return () => window.removeEventListener("keydown", key);
	}, [togglePlay, scrub, cur]);

	const insets = useMemo(() => ({ left: wide ? 304 : 0, right: wide ? 364 : 0, top: 70, bottom: 150 }), [wide]);
	const scan = journey ? EXPLORER[journey.token.chainId] || EXPLORER[1] : EXPLORER[1];
	const kcol = journey ? KIND_META[journey.kind].color : KIND_META.wallet.color;
	const sel = model && selected !== null ? model.journey.peers[selected] : null;
	const selStat = selected !== null ? now.get(selected) : undefined;

	// the activity feed: newest first up to the cursor, optionally for one counterparty
	const feed = useMemo(() => {
		if (!model || !state) return [];
		const rows: { t: number; in: number; out: number; txs: number; who: string; extra: number; balance: number }[] = [];
		for (let k = state.day; k >= 0 && rows.length < 40; k--) {
			const d = model.journey.days[k];
			const mine = selected !== null ? d.peers.find((p) => p.i === selected) : d.peers[0];
			if (!mine) continue;
			const p = model.journey.peers[mine.i];
			rows.push({
				t: d.t,
				in: selected !== null ? mine.in : d.in,
				out: selected !== null ? mine.out : d.out,
				txs: selected !== null ? mine.count : d.txs,
				who: p.label || shortAddr(p.address),
				extra: d.peers.length - 1,
				balance: d.balance,
			});
		}
		return rows;
	}, [model, state, selected]);

	const back = journey ? `/godeye#token=${encodeURIComponent(journey.token.key)}&focus=${journey.address}&sel=${journey.address}` : "/godeye";
	const ready = boot.ready && !!model && !!state;
	const kindTotal = state ? [...state.byKind.entries()].reduce((a, [k, v]) => (hidden.has(k) ? a : a + v), 0) : 0;
	const visiblePeers = state ? state.peers.filter((p) => !hidden.has(p.kind)) : [];

	return (
		<div className="absolute inset-0 overflow-hidden bg-[#05070d]">
			{model && (
				<GodEyeJourneyCanvas
					ref={canvas}
					model={model}
					cur={cur}
					selected={selected}
					hidden={hidden}
					limit={top}
					now={now}
					insets={insets}
					fitKey={fitKey}
					onSelect={setSelected}
				/>
			)}

			{!ready && !error && <GodEyeLoading sync={boot.sync} unreachable={boot.unreachable} />}
			{boot.ready && error && (
				<div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
					<Glass className="px-5 py-4 text-center text-sm">
						<div className="font-semibold">No timeline for this address</div>
						<div className="mt-1 text-xs text-rose-400">{error}</div>
						<div className="mt-3">
							<Link href="/godeye" className="text-xs text-sky-400">
								← back to GodEye
							</Link>
						</div>
					</Glass>
				</div>
			)}

			{/* header */}
			<Glass className="absolute left-3 right-3 top-3 z-20 flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2">
				<Link href={back} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10">
					← Map
				</Link>
				<div className="flex min-w-0 items-center gap-2">
					<Dot color={kcol} />
					<span className="truncate text-sm font-semibold">{journey?.label || (address ? shortAddr(address) : "…")}</span>
					{journey && (
						<span className="rounded-full border px-2 py-px text-[10px]" style={{ color: kcol, borderColor: kcol }}>
							{KIND_META[journey.kind].name}
						</span>
					)}
					<span className="hidden font-mono text-[11px] text-slate-500 md:inline">{address}</span>
				</div>
				<div className="ml-auto flex items-center gap-1.5">
					<span className="hidden text-[10px] uppercase tracking-widest text-slate-500 sm:inline">Timeline</span>
					{boot.ready && token && (
						<select
							value={token}
							onChange={(e) => {
								setToken(e.target.value);
								setSelected(null);
								setAt(null);
								setPlaying(false);
								setHashRead(false);
							}}
							className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs outline-none [&>option]:bg-[#0e121e]"
						>
							{boot.tokens.map((t) => (
								<option key={t.key} value={t.key}>
									{t.symbol} · {t.chain}
								</option>
							))}
						</select>
					)}
					{address && (
						<a
							className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10"
							href={`${scan}/address/${address}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							Explorer ↗
						</a>
					)}
					<span className="hidden text-[10px] uppercase tracking-wider text-slate-500 sm:inline">Nodes</span>
					<input
						type="range"
						min={10}
						max={300}
						step={5}
						value={topLocal}
						onChange={(e) => setTopLocal(Number(e.target.value))}
						onMouseUp={() => setTop(topLocal)}
						onTouchEnd={() => setTop(topLocal)}
						onKeyUp={() => setTop(topLocal)}
						className="w-24 accent-sky-400"
					/>
					<span className="w-8 rounded-lg border border-white/10 bg-white/5 py-0.5 text-center text-xs tabular-nums">{topLocal}</span>
					<IconButton
						onClick={() => {
							canvas.current?.fit();
							setFitKey((k) => k + 1);
						}}
					>
						Fit
					</IconButton>
				</div>
			</Glass>

			{ready && model && state && journey && (
				<>
					{wide && (
						<div className="absolute bottom-[148px] left-3 top-[64px] z-10 w-[292px]">
							<Glass className="flex h-full min-h-0 flex-col gap-4 overflow-auto p-3.5 [scrollbar-width:thin]">
								<div>
									<SectionTitle>Insights</SectionTitle>
									<div className="grid grid-cols-2 gap-2">
										{facts.map((f) => (
											<div key={f.title} className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5">
												<div className="text-[10px] uppercase tracking-wider text-slate-400">{f.title}</div>
												<div className="text-[13px] font-semibold leading-tight">{f.value}</div>
												{f.sub && <div className="truncate text-[10px] text-slate-500">{f.sub}</div>}
											</div>
										))}
									</div>
								</div>

								<div>
									<SectionTitle right={hidden.size ? `${hidden.size} hidden` : `${state.peers.length} met`}>Counterparties by category</SectionTitle>
									<div className="mb-2 flex h-2 overflow-hidden rounded-full bg-white/5">
										{[...state.byKind.entries()]
											.filter(([k]) => !hidden.has(k))
											.sort((a, b) => b[1] - a[1])
											.map(([k, v]) => (
												<div key={k} title={KIND_META[k].name} style={{ width: `${(v / (kindTotal || 1)) * 100}%`, background: KIND_META[k].color }} className="transition-all duration-300" />
											))}
									</div>
									{kinds.map((k) => {
										const off = hidden.has(k);
										const v = state.byKind.get(k) ?? 0;
										return (
											<div
												key={k}
												onClick={() => {
													toggleKind(k);
													if (selected !== null && model.journey.peers[selected].kind === k) setSelected(null);
												}}
												title={off ? "Click to show" : "Click to hide"}
												className={`grid cursor-pointer grid-cols-[12px_1fr_auto] items-center gap-2 rounded-lg px-1.5 py-1 text-[13px] hover:bg-white/5 ${off ? "opacity-35" : ""}`}
											>
												<Dot color={KIND_META[k].color} size={8} />
												<span>{KIND_META[k].name}</span>
												<span className="text-[11px] tabular-nums text-slate-400">{v > 0 && !off ? pct(v / (kindTotal || 1), 0) : off ? "hidden" : "–"}</span>
											</div>
										);
									})}
								</div>

								<div>
									<SectionTitle right={dateStr(cur)}>Biggest counterparties so far</SectionTitle>
									{visiblePeers.length === 0 && <div className="text-xs text-slate-400">Nothing happened yet.</div>}
									{visiblePeers.slice(0, 12).map((p) => (
										<div
											key={p.i}
											onClick={() => setSelected(p.i === selected ? null : p.i)}
											className={`grid cursor-pointer grid-cols-[10px_1fr_auto] items-center gap-2 rounded-lg px-1 py-1 text-[13px] hover:bg-white/10 ${p.i === selected ? "bg-white/10" : ""}`}
										>
											<Dot color={KIND_META[p.kind].color} size={8} />
											<span className="truncate">{p.label || shortAddr(p.address)}</span>
											<span className="text-[11px] tabular-nums">
												<span className="text-green-400">{fmt(p.in)}</span> <span className="text-rose-400">{fmt(p.out)}</span>
											</span>
										</div>
									))}
								</div>
							</Glass>
						</div>
					)}

					<div className="absolute bottom-[148px] right-3 top-[64px] z-10 w-[340px] max-w-[calc(100%-24px)] max-lg:top-auto max-lg:h-[40%]">
						<Glass className="flex h-full min-h-0 flex-col gap-4 overflow-auto p-3.5 [scrollbar-width:thin]">
							<div className="grid grid-cols-2 gap-2">
								<StatCard label="Balance" value={fmt(state.balance)} sub={`${journey.token.symbol} on ${dateStr(cur)}`} />
								<StatCard label="Transfers" value={state.txs.toLocaleString()} sub="since the first one" />
								<StatCard label="Received" value={fmt(state.inflow)} valueClass="text-green-400" />
								<StatCard label="Sent" value={fmt(state.outflow)} valueClass="text-rose-400" sub={`net ${fmt(state.inflow - state.outflow)}`} />
							</div>

							{sel && (
								<div className="rounded-xl border border-sky-400/30 bg-sky-400/[0.06] p-2.5">
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0">
											<div className="flex items-center gap-2 text-sm font-semibold">
												<Dot color={KIND_META[sel.kind].color} size={8} />
												<span className="truncate">{sel.label || shortAddr(sel.address)}</span>
											</div>
											<div className="break-all font-mono text-[10px] text-slate-400">{sel.address}</div>
										</div>
										<button className="px-1 text-lg leading-none text-slate-400 hover:text-white" onClick={() => setSelected(null)}>
											×
										</button>
									</div>
									<div className="mt-1.5 text-[12px] tabular-nums text-slate-300">
										{selStat ? (
											<>
												<span className="text-green-400">← {fmt(selStat.in)}</span> · <span className="text-rose-400">→ {fmt(selStat.out)}</span> · {selStat.count} transfers
												<div className="text-[10px] text-slate-500">
													{dateStr(selStat.first)} → {dateStr(selStat.last)}
												</div>
											</>
										) : (
											<span className="text-slate-500">not met yet at this date</span>
										)}
									</div>
									<div className="mt-2 flex gap-1.5">
										<Link
											href={`/godeye/${sel.address}?token=${encodeURIComponent(journey.token.key)}`}
											className="rounded-lg border border-sky-400/50 bg-sky-400/15 px-2.5 py-1 text-xs text-white hover:bg-sky-400/25"
										>
											◈ Open timeline
										</Link>
										<a
											className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10"
											href={`${scan}/address/${sel.address}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											Explorer ↗
										</a>
									</div>
								</div>
							)}

							<div>
								<SectionTitle right={sel ? "with this counterparty" : "newest first"}>Activity up to {dateStr(cur)}</SectionTitle>
								{feed.length === 0 && <div className="text-xs text-slate-400">No activity before this date.</div>}
								{feed.map((r) => (
									<div key={r.t} className="grid grid-cols-[1fr_auto] gap-2 border-b border-white/5 py-1 text-[11px]">
										<span>
											{r.in > 0 && <span className="text-green-400">← {fmt(r.in)} </span>}
											{r.out > 0 && <span className="text-rose-400">→ {fmt(r.out)} </span>}
											<span className="text-slate-400">
												{r.who}
												{!sel && r.extra > 0 ? ` +${r.extra}` : ""} · {r.txs}×
											</span>
										</span>
										<span className="text-right">
											{dateStr(r.t)}
											<br />
											<span className="text-slate-500">bal {fmt(r.balance)}</span>
										</span>
									</div>
								))}
							</div>
						</Glass>
					</div>
				</>
			)}

			{ready && model && (
				<div className="absolute bottom-3 left-3 right-3 z-10">
					<GodEyeTimeline
						timeline={model.series}
						at={at}
						playing={playing}
						rate={rate}
						title="Account timeline"
						labels={LABELS}
						info={`${model.journey.days.length.toLocaleString()} active days · ${(state?.peers.length ?? 0).toLocaleString()} of ${model.journey.peers.length.toLocaleString()} counterparties`}
						hoverText={(p, t) => `${dateStr(t)} · balance ${fmt(p.supply)} · ${p.holders} counterparties`}
						onScrub={scrub}
						onPlay={togglePlay}
						onRate={setRate}
						onLive={() => {
							setPlaying(false);
							setAt(null);
						}}
					/>
				</div>
			)}

			<div className="pointer-events-none absolute bottom-[152px] right-[364px] z-[4] hidden text-right text-[11px] text-slate-500 lg:block">
				drag pan · wheel zoom · click inspect · space play · ←/→ ±1 week · F fit
			</div>
			{loading && !model && <div className="sr-only">loading</div>}
		</div>
	);
}
