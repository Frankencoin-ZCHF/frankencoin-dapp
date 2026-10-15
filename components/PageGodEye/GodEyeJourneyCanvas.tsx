import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { KIND_META, KIND_ORDER } from "./godeye.constants";
import { clamp, fmt, rgba, shortAddr } from "./godeye.format";
import { dayAt, JourneyModel, PeerStat } from "./godeye.journey";
import { GLASS } from "./GodEyeUi";

export type JourneyCanvasHandle = { fit: () => void };

type Props = {
	model: JourneyModel;
	cur: number;
	selected: number | null;
	/** cumulative numbers per peer at the cursor */
	now: Map<number, PeerStat>;
	insets: { left: number; right: number; top: number; bottom: number };
	fitKey: number;
	onSelect: (i: number | null) => void;
};

type LNode = { i: number; x: number; y: number; r: number; color: string; first: number; a: number; shown: boolean };
type Particle = { n: LNode; dir: 1 | -1; p: number; w: number };
type Ring = { x: number; y: number; color: string; t: number; hub?: boolean };

const MAX_NODES = 220;
const IN = "#4ade80";
const OUT = "#fb7185";
const hash = (n: number) => {
	const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
	return s - Math.floor(s);
};

/** deterministic radial layout: sectors per category, big counterparties close to the hub, then a short relaxation */
function layout(model: JourneyModel): { nodes: LNode[]; reach: number } {
	const list = model.totals
		.filter((p) => p.count > 0)
		.sort((a, b) => b.in + b.out - (a.in + a.out))
		.slice(0, MAX_NODES);
	const mx = Math.max(...list.map((p) => p.in + p.out), 1e-9);
	const tr: number[] = [];
	const nodes: LNode[] = list.map((p, rank) => {
		const sector = KIND_ORDER.indexOf(p.kind);
		const width = (Math.PI * 2) / KIND_ORDER.length;
		const ang = sector * width - Math.PI / 2 + (hash(p.i + 1) - 0.5) * width * 0.9;
		const rad = 150 + 330 * Math.pow(rank / Math.max(list.length - 1, 1), 0.65) + (hash(p.i + 7) - 0.5) * 40;
		tr.push(rad);
		return {
			i: p.i,
			x: Math.cos(ang) * rad,
			y: Math.sin(ang) * rad,
			r: 4 + 15 * Math.sqrt((p.in + p.out) / mx),
			color: KIND_META[p.kind].color,
			first: p.first,
			a: 0,
			shown: false,
		};
	});
	for (let it = 0; it < 70; it++) {
		for (let a = 0; a < nodes.length; a++) {
			for (let b = a + 1; b < nodes.length; b++) {
				const dx = nodes[b].x - nodes[a].x,
					dy = nodes[b].y - nodes[a].y;
				const d = Math.hypot(dx, dy) || 0.01;
				const min = nodes[a].r + nodes[b].r + 14;
				if (d < min) {
					const push = (min - d) / 2 / d;
					nodes[a].x -= dx * push;
					nodes[a].y -= dy * push;
					nodes[b].x += dx * push;
					nodes[b].y += dy * push;
				}
			}
		}
		nodes.forEach((n, k) => {
			const d = Math.hypot(n.x, n.y) || 1;
			const f = (tr[k] - d) * 0.08;
			n.x += (n.x / d) * f;
			n.y += (n.y / d) * f;
		});
	}
	return { nodes, reach: Math.max(...nodes.map((n) => Math.hypot(n.x, n.y) + n.r), 200) + 50 };
}

const GodEyeJourneyCanvas = forwardRef<JourneyCanvasHandle, Props>(function GodEyeJourneyCanvas(props, ref) {
	const canvas = useRef<HTMLCanvasElement>(null);
	const live = useRef(props);
	live.current = props;
	const lay = useMemo(() => layout(props.model), [props.model]);
	const byPeer = useMemo(() => new Map(lay.nodes.map((n) => [n.i, n])), [lay]);
	const peak = useMemo(() => Math.max(...props.model.series.map((p) => p.supply), 1e-9), [props.model]);
	const [tip, setTip] = useState<{ i: number; x: number; y: number } | null>(null);

	const view = useRef({ x: 0, y: 0, k: 1, tx: 0, ty: 0, tk: 1 });
	const fitView = () => {
		const c = canvas.current;
		if (!c) return;
		const { insets } = live.current;
		const w = c.clientWidth,
			h = c.clientHeight;
		const aw = Math.max(w - insets.left - insets.right, 200),
			ah = Math.max(h - insets.top - insets.bottom, 200);
		const v = view.current;
		v.tk = clamp(Math.min(aw, ah) / (lay.reach * 2), 0.2, 2);
		v.tx = insets.left + aw / 2;
		v.ty = insets.top + ah / 2;
	};
	useImperativeHandle(ref, () => ({ fit: fitView }));

	// refit when the data, the free area or an explicit request changes
	useEffect(() => {
		fitView();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lay, props.fitKey, props.insets.left, props.insets.right, props.insets.top, props.insets.bottom]);

	useEffect(() => {
		const c = canvas.current!;
		const g = c.getContext("2d")!;
		const particles: Particle[] = [];
		const rings: Ring[] = [];
		const s = { last: performance.now(), lastCur: live.current.cur, bal: 0, hubPulse: 0, hover: null as number | null, w: 0, h: 0 };
		let raf = 0;
		let first = true;

		const resize = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			s.w = c.clientWidth;
			s.h = c.clientHeight;
			c.width = Math.round(s.w * dpr);
			c.height = Math.round(s.h * dpr);
			g.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		resize();
		const ro = new ResizeObserver(() => {
			resize();
			fitView();
		});
		ro.observe(c);

		const spawn = (from: number, to: number) => {
			const { model } = live.current;
			const a = dayAt(model, from),
				b = dayAt(model, to);
			if (b <= a || b - a > 120) return;
			for (let k = a + 1; k <= b; k++) {
				for (const p of model.journey.days[k].peers) {
					const n = byPeer.get(p.i);
					if (!n || particles.length > 90) continue;
					if (p.in > 0) particles.push({ n, dir: -1, p: -Math.random() * 0.5, w: p.in });
					if (p.out > 0) particles.push({ n, dir: 1, p: -Math.random() * 0.5, w: p.out });
				}
			}
		};

		const frame = (now: number) => {
			raf = requestAnimationFrame(frame);
			const dt = Math.min((now - s.last) / 1000, 0.1);
			s.last = now;
			const { model, cur, selected } = live.current;
			const v = view.current;
			const e = first ? 1 : 1 - Math.exp(-dt * 8);
			v.x += (v.tx - v.x) * e;
			v.y += (v.ty - v.y) * e;
			v.k += (v.tk - v.k) * e;
			first = false;

			if (cur !== s.lastCur) {
				if (cur > s.lastCur) spawn(s.lastCur, cur);
				s.lastCur = cur;
			}
			const d = dayAt(model, cur);
			const balTarget = d >= 0 ? model.journey.days[d].balance : 0;
			s.bal += (balTarget - s.bal) * (1 - Math.exp(-dt * 5));
			s.hubPulse = Math.max(0, s.hubPulse - dt * 1.6);

			const W = s.w,
				H = s.h;
			g.clearRect(0, 0, W, H);
			const hx = v.x,
				hy = v.y,
				k = v.k;
			const kc = KIND_META[model.journey.kind].color;

			// orbits
			g.lineWidth = 1;
			for (const rr of [150, 280, 410, 540]) {
				g.strokeStyle = "rgba(148,163,184,.06)";
				g.beginPath();
				g.arc(hx, hy, rr * k, 0, Math.PI * 2);
				g.stroke();
			}

			// nodes follow the cursor in time
			for (const n of lay.nodes) {
				const want = n.first <= cur ? 1 : 0;
				n.a += (want - n.a) * (1 - Math.exp(-dt * 7));
				if (want && !n.shown) {
					n.shown = true;
					if (n.a < 0.05) rings.push({ x: n.x, y: n.y, color: n.color, t: 0 });
				}
				if (!want) n.shown = false;
			}

			const stats = live.current.now;
			for (const n of lay.nodes) {
				if (n.a < 0.02) continue;
				const st = stats.get(n.i);
				const sel = selected === n.i || s.hover === n.i;
				const net = st ? st.in - st.out : 0;
				const tot = st ? st.in + st.out : 0;
				// the edge leans green for net funders and red for net receivers
				const col = tot > 0 ? (net / tot > 0.25 ? IN : net / tot < -0.25 ? OUT : n.color) : n.color;
				g.strokeStyle = rgba(col, (sel ? 0.7 : 0.16) * n.a);
				g.lineWidth = sel ? 1.6 : 0.6 + Math.min(Math.log10(1 + tot) * 0.25, 1.4);
				g.beginPath();
				g.moveTo(hx, hy);
				g.lineTo(hx + n.x * k, hy + n.y * k);
				g.stroke();
			}

			for (const n of lay.nodes) {
				if (n.a < 0.02) continue;
				const X = hx + n.x * k,
					Y = hy + n.y * k;
				if (X < -40 || Y < -40 || X > W + 40 || Y > H + 40) continue;
				const over = 1 + Math.sin(Math.min(n.a, 1) * Math.PI) * 0.35; // little pop when it appears
				const R = n.r * k * n.a * over;
				const sel = selected === n.i || s.hover === n.i;
				const grd = g.createRadialGradient(X, Y, 0, X, Y, R * 2.4);
				grd.addColorStop(0, rgba(n.color, 0.35 * n.a));
				grd.addColorStop(1, rgba(n.color, 0));
				g.fillStyle = grd;
				g.beginPath();
				g.arc(X, Y, R * 2.4, 0, Math.PI * 2);
				g.fill();
				g.fillStyle = rgba(n.color, 0.9 * n.a);
				g.beginPath();
				g.arc(X, Y, R, 0, Math.PI * 2);
				g.fill();
				if (sel) {
					g.strokeStyle = "#fff";
					g.lineWidth = 1.5;
					g.beginPath();
					g.arc(X, Y, R + 4, 0, Math.PI * 2);
					g.stroke();
				}
				if (R > 8 || sel) {
					const p = model.journey.peers[n.i];
					g.fillStyle = `rgba(226,232,240,${0.85 * Math.min(n.a, 1)})`;
					g.font = "11px sans-serif";
					g.textAlign = "center";
					g.fillText(p.label || shortAddr(p.address), X, Y + R + 13);
				}
			}

			// pulse rings of newly met counterparties
			for (let i = rings.length - 1; i >= 0; i--) {
				const r = rings[i];
				r.t += dt;
				if (r.t > 1.2) {
					rings.splice(i, 1);
					continue;
				}
				g.strokeStyle = rgba(r.color, (1 - r.t / 1.2) * 0.8);
				g.lineWidth = 2;
				g.beginPath();
				g.arc(hx + r.x * k, hy + r.y * k, (6 + r.t * 46) * k, 0, Math.PI * 2);
				g.stroke();
			}

			// value flowing along the edges
			for (let i = particles.length - 1; i >= 0; i--) {
				const p = particles[i];
				p.p += dt / 1.1;
				if (p.p >= 1) {
					s.hubPulse = Math.min(1, s.hubPulse + (p.dir === -1 ? 0.35 : 0.15));
					particles.splice(i, 1);
					continue;
				}
				if (p.p < 0) continue;
				const t = p.dir === -1 ? p.p : 1 - p.p; // 0 = hub, 1 = node
				const e2 = p.p * p.p * (3 - 2 * p.p);
				const u = p.dir === -1 ? 1 - e2 : e2;
				const X = hx + p.n.x * k * u,
					Y = hy + p.n.y * k * u;
				void t;
				const col = p.dir === -1 ? IN : OUT;
				const sz = (1.6 + Math.min(Math.log10(1 + p.w) * 0.7, 3)) * Math.sqrt(k);
				g.shadowColor = col;
				g.shadowBlur = 10;
				g.fillStyle = col;
				g.beginPath();
				g.arc(X, Y, sz, 0, Math.PI * 2);
				g.fill();
				g.shadowBlur = 0;
			}

			// the hub: size follows the balance at the cursor
			const share = clamp(s.bal / peak, 0, 1);
			const HR = (24 + 16 * Math.sqrt(share)) * Math.sqrt(k) * (1 + s.hubPulse * 0.12);
			const hg = g.createRadialGradient(hx, hy, 0, hx, hy, HR * 3.2);
			hg.addColorStop(0, rgba(kc, 0.45 + s.hubPulse * 0.3));
			hg.addColorStop(1, rgba(kc, 0));
			g.fillStyle = hg;
			g.beginPath();
			g.arc(hx, hy, HR * 3.2, 0, Math.PI * 2);
			g.fill();
			g.fillStyle = "#0b1020";
			g.strokeStyle = kc;
			g.lineWidth = 2;
			g.beginPath();
			g.arc(hx, hy, HR, 0, Math.PI * 2);
			g.fill();
			g.stroke();
			g.strokeStyle = "#ffd84d";
			g.lineWidth = 4;
			g.shadowColor = "#ffd84d";
			g.shadowBlur = 8;
			g.beginPath();
			g.arc(hx, hy, HR + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * share);
			g.stroke();
			g.shadowBlur = 0;
			g.fillStyle = "#e2e8f0";
			g.textAlign = "center";
			g.font = "600 12px sans-serif";
			g.fillText(fmt(s.bal), hx, hy + 4);
			g.font = "11px sans-serif";
			g.fillStyle = "rgba(226,232,240,.75)";
			g.fillText(model.journey.label || shortAddr(model.journey.address), hx, hy + HR + 22);
		};
		raf = requestAnimationFrame(frame);

		// ---- interaction
		const hit = (px: number, py: number): LNode | null => {
			const v = view.current;
			let best: LNode | null = null,
				bd = Infinity;
			for (const n of lay.nodes) {
				if (n.a < 0.3) continue;
				const d = Math.hypot(v.x + n.x * v.k - px, v.y + n.y * v.k - py);
				if (d < n.r * v.k + 6 && d < bd) (best = n), (bd = d);
			}
			return best;
		};
		let drag: { x: number; y: number; moved: boolean } | null = null;
		const down = (ev: PointerEvent) => {
			c.setPointerCapture(ev.pointerId);
			drag = { x: ev.clientX, y: ev.clientY, moved: false };
		};
		const move = (ev: PointerEvent) => {
			const r = c.getBoundingClientRect();
			if (drag) {
				const dx = ev.clientX - drag.x,
					dy = ev.clientY - drag.y;
				if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
				const v = view.current;
				v.x += dx;
				v.tx += dx;
				v.y += dy;
				v.ty += dy;
				drag.x = ev.clientX;
				drag.y = ev.clientY;
				return;
			}
			const n = hit(ev.clientX - r.left, ev.clientY - r.top);
			s.hover = n ? n.i : null;
			c.style.cursor = n ? "pointer" : "grab";
			setTip(n ? { i: n.i, x: ev.clientX - r.left, y: ev.clientY - r.top } : null);
		};
		const up = (ev: PointerEvent) => {
			if (drag && !drag.moved) {
				const r = c.getBoundingClientRect();
				const n = hit(ev.clientX - r.left, ev.clientY - r.top);
				live.current.onSelect(n ? n.i : null);
			}
			drag = null;
		};
		const wheel = (ev: WheelEvent) => {
			ev.preventDefault();
			const r = c.getBoundingClientRect();
			const px = ev.clientX - r.left,
				py = ev.clientY - r.top;
			const v = view.current;
			const nk = clamp(v.tk * Math.exp(-ev.deltaY * 0.0015), 0.15, 5);
			const f = nk / v.tk;
			v.tx = px - (px - v.tx) * f;
			v.ty = py - (py - v.ty) * f;
			v.tk = nk;
		};
		const leave = () => {
			s.hover = null;
			setTip(null);
		};
		c.addEventListener("pointerdown", down);
		c.addEventListener("pointermove", move);
		c.addEventListener("pointerup", up);
		c.addEventListener("pointerleave", leave);
		c.addEventListener("wheel", wheel, { passive: false });
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			c.removeEventListener("pointerdown", down);
			c.removeEventListener("pointermove", move);
			c.removeEventListener("pointerup", up);
			c.removeEventListener("pointerleave", leave);
			c.removeEventListener("wheel", wheel);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lay, byPeer, peak]);

	const tipPeer = tip ? props.model.journey.peers[tip.i] : null;
	const tipStat = tip ? props.now.get(tip.i) : null;

	return (
		<>
			<canvas ref={canvas} className="absolute inset-0 h-full w-full cursor-grab touch-none" />
			{tip && tipPeer && (
				<div className={`${GLASS} pointer-events-none absolute z-20 px-3 py-2 text-xs`} style={{ left: tip.x + 14, top: tip.y + 14 }}>
					<div className="font-semibold">{tipPeer.label || shortAddr(tipPeer.address)}</div>
					<div className="text-[10px]" style={{ color: KIND_META[tipPeer.kind].color }}>
						{KIND_META[tipPeer.kind].name}
					</div>
					{tipStat && (
						<div className="mt-1 tabular-nums text-slate-300">
							<span className="text-green-400">← {fmt(tipStat.in)}</span> · <span className="text-rose-400">→ {fmt(tipStat.out)}</span> · {tipStat.count} transfers
						</div>
					)}
				</div>
			)}
		</>
	);
});

export default GodEyeJourneyCanvas;
