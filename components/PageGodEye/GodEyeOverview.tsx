import { KIND_META } from "./godeye.constants";
import { dateStr, fmt, pct, shortAddr } from "./godeye.format";
import { GodEyeGraph, GodEyeHolders, GodEyeKind } from "./godeye.types";
import { Dot, Glass, StatCard, SectionTitle } from "./GodEyeUi";

type Props = {
	graph: GodEyeGraph;
	holders: GodEyeHolders;
	windowSeconds: number;
	hidden: Set<GodEyeKind>;
	onToggleKind: (k: GodEyeKind) => void;
	onPick: (address: string) => void;
	onCollapse: () => void;
};

export default function GodEyeOverview({ graph: g, holders: h, windowSeconds, hidden, onToggleKind, onPick, onCollapse }: Props) {
	const sym = g.token.symbol;
	const volume = g.edges.reduce((s, e) => s + e.amount, 0);
	const max = h.list.length ? h.list[0].balance : 1;
	const maxBucket = Math.max(...h.buckets.map((b) => b.holders), 1);
	const present = g.kinds.filter((k) => k.addresses || k.inflow || k.outflow);

	return (
		<Glass className="flex h-full min-h-0 flex-col overflow-auto p-3 [scrollbar-width:thin]">
			<div className="space-y-4">
				<div>
					<SectionTitle
						right={
							<button className="px-1 text-base leading-none text-slate-400 hover:text-white" onClick={onCollapse} title="Collapse">
								‹
							</button>
						}
					>
						Overview
					</SectionTitle>
					<div className="grid grid-cols-2 gap-2">
						<StatCard label="Supply" value={fmt(g.supply)} sub={`${sym} · ${dateStr(g.at)}`} />
						<StatCard label="Holders" value={g.holders.toLocaleString()} sub="accounts > 0.005" />
						<StatCard label="Top 10 hold" value={pct(h.top10)} sub={`top 1: ${pct(h.top1)}`} />
						<StatCard
							label="Flow shown"
							value={fmt(volume)}
							sub={`${windowSeconds ? Math.round(windowSeconds / 86400) + "d window" : "all time"}${g.mode === "entities" ? ` · ${pct(g.coverage, 0)} mapped` : ""}`}
						/>
					</div>
				</div>

				<div>
					<SectionTitle right={g.mode === "entities" ? "click to filter" : undefined}>Where the money sits</SectionTitle>
					<div className="space-y-0.5">
						{present.map((k) => {
							const off = hidden.has(k.kind);
							return (
								<div
									key={k.kind}
									onClick={() => g.mode === "entities" && k.kind !== "mint" && onToggleKind(k.kind)}
									className={`grid cursor-pointer grid-cols-[12px_1fr_auto] items-center gap-2 rounded-lg px-1.5 py-1 text-[13px] hover:bg-white/5 ${off ? "opacity-35" : ""}`}
								>
									<Dot color={KIND_META[k.kind].color} />
									<span>{KIND_META[k.kind].name}</span>
									<span className="text-[11px] tabular-nums text-slate-400">
										{k.kind === "mint" ? `minted ${fmt(k.outflow)}` : `${fmt(k.balance)} · ${k.addresses}`}
									</span>
								</div>
							);
						})}
					</div>
				</div>

				<div>
					<SectionTitle right={dateStr(h.at)}>Rich list</SectionTitle>
					<div className="space-y-0.5">
						{h.list.map((x, i) => (
							<div
								key={x.address}
								onClick={() => onPick(x.address)}
								className="relative grid cursor-pointer grid-cols-[20px_1fr_auto] items-center gap-2 overflow-hidden rounded-lg px-1.5 py-1 text-[13px] hover:bg-white/10"
							>
								<span className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-sky-400/25 to-transparent" style={{ width: `${(x.balance / max) * 100}%` }} />
								<span className="relative text-right text-[10px] text-slate-500">{i + 1}</span>
								<span className="relative flex items-center gap-1.5 truncate">
									<Dot color={KIND_META[x.kind].color} size={7} />
									<span className="truncate">{x.label || shortAddr(x.address)}</span>
								</span>
								<span className="relative text-[11px] tabular-nums text-slate-400">
									{fmt(x.balance)} · {pct(x.share)}
								</span>
							</div>
						))}
					</div>
				</div>

				<div>
					<SectionTitle>Holder distribution</SectionTitle>
					<div className="flex h-14 items-end gap-1">
						{h.buckets.map((b) => (
							<div
								key={b.label}
								title={`${b.holders} holders · ${fmt(b.balance)} ${sym}`}
								className="min-h-[2px] flex-1 rounded-t bg-gradient-to-b from-sky-400 to-sky-400/15"
								style={{ height: `${Math.max(4, Math.sqrt(b.holders / maxBucket) * 100)}%` }}
							/>
						))}
					</div>
					<div className="mt-1 flex gap-1 text-center text-[9px] text-slate-500">
						{h.buckets.map((b) => (
							<span key={b.label} className="flex-1">
								{b.label}
								<br />
								{b.holders}
							</span>
						))}
					</div>
				</div>
			</div>
		</Glass>
	);
}
