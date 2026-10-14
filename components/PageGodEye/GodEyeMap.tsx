import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { KIND_META } from "./godeye.constants";
import { fmt, pct, shortAddr } from "./godeye.format";
import { EngineInsets, GodEyeEngine } from "./godeye.engine";
import { GodEyeGraph, GodEyeKind, GodEyeNode, GodEyeRank } from "./godeye.types";
import { GLASS } from "./GodEyeUi";

export type GodEyeMapHandle = {
	fit: () => void;
	flyTo: (id: string) => void;
	reset: () => void;
	has: (id: string) => boolean;
};

type Props = {
	graph: GodEyeGraph | null;
	rank: GodEyeRank;
	hidden: Set<GodEyeKind>;
	three: boolean;
	selected: string | null;
	focus: string | null;
	insets: EngineInsets;
	/** bump to refit the camera once the next graph has been applied */
	fitKey: number;
	minimapClass?: string;
	onSelect: (id: string | null) => void;
	onFocus: (id: string) => void;
	onDive: (kind: GodEyeKind) => void;
};

const GodEyeMap = forwardRef<GodEyeMapHandle, Props>(function GodEyeMap(props, ref) {
	const canvas = useRef<HTMLCanvasElement>(null);
	const mini = useRef<HTMLCanvasElement>(null);
	const engine = useRef<GodEyeEngine | null>(null);
	const cb = useRef(props);
	cb.current = props;
	const lastFit = useRef(props.fitKey);
	const [tip, setTip] = useState<{ node: GodEyeNode; x: number; y: number } | null>(null);

	useImperativeHandle(ref, () => ({
		fit: () => engine.current?.fit(true),
		flyTo: (id) => engine.current?.flyTo(id),
		reset: () => engine.current?.reset(),
		has: (id) => !!engine.current?.has(id),
	}));

	useEffect(() => {
		const e = new GodEyeEngine(
			canvas.current!,
			{
				onSelect: (id) => cb.current.onSelect(id),
				onFocus: (id) => cb.current.onFocus(id),
				onDive: (k) => cb.current.onDive(k),
				onHover: setTip,
			},
			mini.current
		);
		engine.current = e;
		return () => {
			e.destroy();
			engine.current = null;
		};
	}, []);

	useEffect(() => engine.current?.setInsets(props.insets), [props.insets]);
	useEffect(() => engine.current?.setHidden(props.hidden), [props.hidden]);
	useEffect(() => engine.current?.setThree(props.three), [props.three]);
	useEffect(() => engine.current?.setSelected(props.selected), [props.selected]);
	useEffect(() => engine.current?.setFocus(props.focus), [props.focus]);

	useEffect(() => {
		const e = engine.current;
		if (!e || !props.graph) return;
		e.setGraph(props.graph, props.rank);
		e.setHidden(cb.current.hidden);
		if (cb.current.fitKey !== lastFit.current) {
			lastFit.current = cb.current.fitKey;
			const t = setTimeout(() => e.fit(true), 350);
			return () => clearTimeout(t);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.graph]);

	const d = tip?.node;
	return (
		<>
			<canvas ref={canvas} className="absolute inset-0 block" />
			<canvas ref={mini} className={`absolute z-[5] hidden h-[110px] w-[150px] cursor-crosshair rounded-xl border border-white/10 bg-[#0e121e]/75 ${props.minimapClass ?? ""}`} />
			{tip && d && (
				<div
					className={`${GLASS} pointer-events-none absolute z-40 max-w-[280px] px-2.5 py-2 text-xs`}
					style={{ left: Math.min(tip.x + 16, Math.max(canvas.current?.clientWidth ?? 0, 300) - 300), top: Math.min(tip.y + 16, Math.max(canvas.current?.clientHeight ?? 0, 150) - 130) }}
				>
					<div className="font-semibold" style={{ color: KIND_META[d.kind].color }}>
						{d.label || shortAddr(d.id)}
					</div>
					{props.graph?.mode === "entities" && d.kind !== "others" && <div className="break-all text-[11px] text-slate-400">{d.id}</div>}
					<div className="text-[11px] text-slate-400">
						{KIND_META[d.kind].name}
						{d.kind !== "mint" && ` · ${fmt(d.balance)} ${props.graph?.token.symbol ?? ""}${d.share ? " · " + pct(d.share, 2) : ""}`}
					</div>
					<div className="text-[11px] text-slate-400">
						in {fmt(d.inflow)} · out {fmt(d.outflow)}
						{props.graph?.mode === "categories" && ` · ${d.txs} addresses`}
					</div>
				</div>
			)}
		</>
	);
});

export default GodEyeMap;
