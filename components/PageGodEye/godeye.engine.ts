import { KIND_META } from "./godeye.constants";
import { clamp, fmt, lerp, pct, rgba, shortAddr } from "./godeye.format";
import { GodEyeGraph, GodEyeKind, GodEyeMode, GodEyeNode, GodEyeRank } from "./godeye.types";

export type EngineInsets = { left: number; right: number; top: number; bottom: number };

export type EngineEvents = {
	onSelect: (id: string | null) => void;
	onFocus: (id: string) => void;
	onDive: (kind: GodEyeKind) => void;
	onHover: (info: { node: GodEyeNode; x: number; y: number } | null) => void;
};

type SNode = {
	id: string;
	data: GodEyeNode;
	kind: GodEyeKind;
	x: number;
	y: number;
	z: number;
	vx: number;
	vy: number;
	vz: number;
	r: number;
	tr: number;
	alpha: number;
	pinned: boolean;
	dead: boolean;
	hidden: boolean;
	sx: number;
	sy: number;
	sz: number;
	sk: number;
	sr: number;
};

type SEdge = { a: SNode; b: SNode; amount: number; via: boolean; norm: number; phase: number; speed: number };

const ANCHORS: GodEyeKind[] = ["wallet", "position", "minter", "savings", "equity", "bridge", "dex", "contract"];

function anchor(kind: GodEyeKind): [number, number] | null {
	const i = ANCHORS.indexOf(kind);
	if (i < 0) return null;
	const a = (i / ANCHORS.length) * Math.PI * 2 + 0.4;
	return [Math.cos(a) * 420, Math.sin(a) * 420];
}

/**
 * Canvas renderer + force layout of the GodEye fund-flow map.
 * Framework free: React only owns the chrome around it and talks to it through this class.
 */
export class GodEyeEngine {
	private ctx: CanvasRenderingContext2D;
	private mctx: CanvasRenderingContext2D | null = null;
	private W = 0;
	private H = 0;
	private DPR = 1;
	private raf = 0;
	private last = 0;
	private time = 0;
	private heat = 1;
	private ro: ResizeObserver;

	private nodes = new Map<string, SNode>();
	private edges: SEdge[] = [];
	private mode: GodEyeMode = "entities";
	private rank: GodEyeRank = "balance";
	private hiddenKinds = new Set<GodEyeKind>();
	private three = false;
	autoRotate = true;
	private insets: EngineInsets = { left: 0, right: 0, top: 0, bottom: 0 };

	private selected: string | null = null;
	private hover: string | null = null;
	private focus: string | null = null;

	private cam = { x: 0, y: 0, zoom: 0.6, yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, f: 1400 };
	private camTween: { z: number; x: number; y: number } | null = null;

	private pointer = {
		down: false,
		x: 0,
		y: 0,
		moved: 0,
		node: null as SNode | null,
		button: 0,
		pts: new Map<number, [number, number]>(),
		pinch: 0,
	};

	private sprites: Partial<Record<GodEyeKind, HTMLCanvasElement>> = {};
	private stars = Array.from({ length: 260 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), p: Math.random() * 6.28 }));
	private mmMap: { sc: number; ox: number; oy: number } | null = null;
	private font = "Avenir, Helvetica, sans-serif";

	constructor(
		private canvas: HTMLCanvasElement,
		private events: EngineEvents,
		private minimap?: HTMLCanvasElement | null
	) {
		this.ctx = canvas.getContext("2d")!;
		this.mctx = minimap ? minimap.getContext("2d") : null;
		this.font = getComputedStyle(canvas).fontFamily || this.font;
		this.ro = new ResizeObserver(() => this.resize());
		this.ro.observe(canvas.parentElement ?? canvas);
		this.resize();
		this.bind();
		this.last = performance.now();
		this.raf = requestAnimationFrame(this.frame);
	}

	// ---------------------------------------------------------------- public api
	destroy() {
		cancelAnimationFrame(this.raf);
		this.ro.disconnect();
		this.unbind();
	}

	setInsets(i: EngineInsets) {
		this.insets = i;
	}

	setHidden(h: Set<GodEyeKind>) {
		this.hiddenKinds = h;
		for (const n of this.nodes.values()) n.hidden = this.mode === "entities" && h.has(n.kind) && n.kind !== "mint";
	}

	setSelected(id: string | null) {
		this.selected = id;
	}

	setFocus(id: string | null) {
		this.focus = id;
	}

	setThree(on: boolean) {
		if (on === this.three) return;
		this.three = on;
		if (on) {
			this.cam.tyaw = 0.55;
			this.cam.tpitch = 0.5;
			for (const n of this.nodes.values()) n.z += (Math.random() - 0.5) * 260;
			this.heat = 1;
		}
		this.fit(true);
	}

	/** drop every node, used when the context (token, mode, focus) changes completely */
	reset() {
		for (const n of this.nodes.values()) n.dead = true;
	}

	flyTo(id: string) {
		const n = this.nodes.get(id);
		if (n) this.camTween = { z: Math.max(this.cam.zoom, 0.9), x: n.x, y: n.y };
	}

	has(id: string): boolean {
		const n = this.nodes.get(id);
		return !!n && !n.dead;
	}

	setGraph(g: GodEyeGraph, rank: GodEyeRank) {
		this.mode = g.mode;
		this.rank = rank;
		const metricOf = (n: GodEyeNode) => {
			if (g.mode === "categories") return n.balance > 0 ? n.balance : (n.inflow + n.outflow) * 0.1;
			return rank === "volume" ? n.inflow + n.outflow : n.balance;
		};
		let maxMetric = 1e-9;
		for (const n of g.nodes) if (n.kind !== "mint" && n.kind !== "others") maxMetric = Math.max(maxMetric, metricOf(n));
		let maxEdge = 1e-9;
		for (const e of g.edges) maxEdge = Math.max(maxEdge, e.amount);

		const nb = new Map<string, string[]>();
		const link = (a: string, b: string) => {
			const l = nb.get(a);
			if (l) l.push(b);
			else nb.set(a, [b]);
		};
		for (const e of g.edges) {
			link(e.s, e.t);
			link(e.t, e.s);
		}

		const seen = new Set<string>();
		for (const d0 of g.nodes) {
			const d = g.mode === "categories" ? { ...d0, label: KIND_META[d0.id as GodEyeKind]?.name ?? d0.label } : d0;
			seen.add(d.id);
			let n = this.nodes.get(d.id);
			if (!n) {
				let x: number, y: number, z: number;
				const near = (nb.get(d.id) || []).map((id) => this.nodes.get(id)).find((o) => o && o.alpha > 0.3);
				if (near) {
					x = near.x + (Math.random() - 0.5) * 80;
					y = near.y + (Math.random() - 0.5) * 80;
					z = near.z + (Math.random() - 0.5) * 80;
				} else {
					const a = Math.random() * Math.PI * 2;
					const r = 360 * (0.4 + Math.random() * 0.8);
					x = Math.cos(a) * r;
					y = Math.sin(a) * r;
					z = (Math.random() - 0.5) * 200;
				}
				n = { id: d.id, data: d, kind: d.kind, x, y, z, vx: 0, vy: 0, vz: 0, r: 4, tr: 4, alpha: 0, pinned: false, dead: false, hidden: false, sx: 0, sy: 0, sz: 0, sk: 1, sr: 4 };
				this.nodes.set(d.id, n);
			}
			n.data = d;
			n.kind = d.kind;
			n.dead = false;
			const m = metricOf(d);
			n.tr = d.kind === "mint" ? 15 : d.kind === "others" ? 20 : 3.5 + 30 * Math.sqrt(Math.max(m, 0) / maxMetric);
			if (g.mode === "categories") n.tr = 14 + 40 * Math.sqrt(Math.max(m, 0) / maxMetric);
			n.hidden = g.mode === "entities" && this.hiddenKinds.has(d.kind) && d.kind !== "mint";
			if (g.mode === "categories") n.pinned = false;
		}
		for (const [id, n] of this.nodes) if (!seen.has(id)) n.dead = true;

		this.edges = [];
		for (const e of g.edges) {
			const a = this.nodes.get(e.s);
			const b = this.nodes.get(e.t);
			if (!a || !b) continue;
			this.edges.push({ a, b, amount: e.amount, via: !!e.via, norm: Math.log1p(e.amount) / Math.log1p(maxEdge), phase: Math.random(), speed: 0.7 + Math.random() * 0.6 });
		}
		this.heat = Math.max(this.heat, 0.9);
	}

	fit(animate = true) {
		const vis = [...this.nodes.values()].filter((n) => !n.dead && !n.hidden);
		if (!vis.length) return;
		let minx = 1e9,
			maxx = -1e9,
			miny = 1e9,
			maxy = -1e9;
		for (const n of vis) {
			minx = Math.min(minx, n.x - n.r);
			maxx = Math.max(maxx, n.x + n.r);
			miny = Math.min(miny, n.y - n.r);
			maxy = Math.max(maxy, n.y + n.r);
		}
		const availW = this.W - this.insets.left - this.insets.right;
		const availH = this.H - this.insets.top - this.insets.bottom;
		const z = clamp(Math.min(availW / (maxx - minx + 160), availH / (maxy - miny + 160)), 0.05, 4) * (this.three ? 0.85 : 1);
		const t = { z, x: (minx + maxx) / 2, y: (miny + maxy) / 2 };
		if (!animate) {
			this.cam.zoom = t.z;
			this.cam.x = t.x;
			this.cam.y = t.y;
			this.camTween = null;
		} else this.camTween = t;
	}

	// ---------------------------------------------------------------- sizing
	private resize() {
		this.DPR = Math.min(window.devicePixelRatio || 1, 2);
		const r = (this.canvas.parentElement ?? this.canvas).getBoundingClientRect();
		this.W = Math.max(r.width, 1);
		this.H = Math.max(r.height, 1);
		this.canvas.width = this.W * this.DPR;
		this.canvas.height = this.H * this.DPR;
		this.canvas.style.width = this.W + "px";
		this.canvas.style.height = this.H + "px";
	}

	private cx() {
		return (this.W + this.insets.left - this.insets.right) / 2;
	}
	private cy() {
		return (this.H + this.insets.top - this.insets.bottom) / 2;
	}

	// ---------------------------------------------------------------- sprites
	private sprite(kind: GodEyeKind): HTMLCanvasElement {
		const hit = this.sprites[kind];
		if (hit) return hit;
		const c = document.createElement("canvas");
		const s = 128;
		c.width = c.height = s;
		const g = c.getContext("2d")!;
		const col = KIND_META[kind].color;
		const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
		grd.addColorStop(0, rgba(col, 0.9));
		grd.addColorStop(0.18, rgba(col, 0.55));
		grd.addColorStop(0.4, rgba(col, 0.16));
		grd.addColorStop(1, rgba(col, 0));
		g.fillStyle = grd;
		g.fillRect(0, 0, s, s);
		this.sprites[kind] = c;
		return c;
	}

	// ---------------------------------------------------------------- simulation
	private simulate() {
		const list = [...this.nodes.values()].filter((n) => n.alpha > 0.02 || !n.dead);
		if (list.length === 0 || this.heat < 0.012) return;
		const n = list.length;
		const cat = this.mode === "categories";
		const rep = cat ? 52000 : 9000;
		for (let i = 0; i < n; i++) {
			const a = list[i];
			for (let j = i + 1; j < n; j++) {
				const b = list[j];
				let dx = a.x - b.x,
					dy = a.y - b.y,
					dz = a.z - b.z;
				const d2 = dx * dx + dy * dy + dz * dz + 40;
				const rr = a.r + b.r + 16;
				let f = (rep * (1 + (a.r + b.r) / 28)) / d2;
				if (d2 < rr * rr) f += (rr - Math.sqrt(d2)) * 0.9;
				const inv = 1 / Math.sqrt(d2);
				dx *= inv;
				dy *= inv;
				dz *= inv;
				a.vx += dx * f;
				a.vy += dy * f;
				a.vz += dz * f;
				b.vx -= dx * f;
				b.vy -= dy * f;
				b.vz -= dz * f;
			}
		}
		for (const e of this.edges) {
			const { a, b } = e;
			if (a.dead || b.dead) continue;
			const dx = b.x - a.x,
				dy = b.y - a.y,
				dz = b.z - a.z;
			const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;
			const L = (cat ? 260 : 70) + (a.r + b.r) * 1.6 + (1 - e.norm) * (cat ? 60 : 130);
			const k = (0.002 + 0.03 * e.norm * e.norm) * (a.kind === "others" || b.kind === "others" ? 0.12 : 1);
			const f = (d - L) * k;
			const fx = (dx / d) * f,
				fy = (dy / d) * f,
				fz = (dz / d) * f;
			a.vx += fx;
			a.vy += fy;
			a.vz += fz;
			b.vx -= fx;
			b.vy -= fy;
			b.vz -= fz;
		}
		for (const a of list) {
			a.vx -= a.x * 0.0022;
			a.vy -= a.y * 0.0022;
			a.vz -= a.z * 0.0022;
			if (!cat) {
				const an = anchor(a.kind);
				if (an) {
					a.vx += (an[0] - a.x) * 0.0016;
					a.vy += (an[1] - a.y) * 0.0016;
				}
			}
			if (!this.three) a.vz += (0 - a.z) * 0.12;
			if (a.pinned) {
				a.vx = a.vy = a.vz = 0;
				continue;
			}
			a.vx *= 0.82;
			a.vy *= 0.82;
			a.vz *= 0.82;
			const sp = Math.hypot(a.vx, a.vy, a.vz);
			const s = sp > 40 ? 40 / sp : 1;
			a.x += a.vx * s * this.heat * 0.6;
			a.y += a.vy * s * this.heat * 0.6;
			a.z += a.vz * s * this.heat * 0.6;
		}
		this.heat *= 0.99;
	}

	// ---------------------------------------------------------------- camera
	private project(n: SNode) {
		const c = this.cam;
		const cy = Math.cos(c.yaw),
			sy = Math.sin(c.yaw),
			cp = Math.cos(c.pitch),
			sp = Math.sin(c.pitch);
		const x = n.x - c.x,
			y = n.y - c.y,
			z = n.z;
		const x1 = x * cy + z * sy,
			z1 = -x * sy + z * cy;
		const y2 = y * cp - z1 * sp,
			z2 = y * sp + z1 * cp;
		const persp = c.f / Math.max(c.f + z2, 60);
		const k = c.zoom * (Math.abs(c.pitch) + Math.abs(c.yaw) < 0.002 ? 1 : persp);
		n.sx = this.cx() + x1 * k;
		n.sy = this.cy() + y2 * k;
		n.sz = z2;
		n.sk = k;
		n.sr = Math.max(n.r * k, 1.2);
	}

	private stepCamera(dt: number) {
		const c = this.cam;
		if (this.camTween) {
			const k = 1 - Math.pow(0.01, dt);
			c.zoom = lerp(c.zoom, this.camTween.z, k);
			c.x = lerp(c.x, this.camTween.x, k);
			c.y = lerp(c.y, this.camTween.y, k);
			if (Math.abs(c.zoom - this.camTween.z) < this.camTween.z * 0.003 && Math.abs(c.x - this.camTween.x) < 1 && Math.abs(c.y - this.camTween.y) < 1) this.camTween = null;
		}
		const k2 = 1 - Math.pow(0.005, dt);
		if (this.three) {
			if (this.autoRotate && !this.pointer.down) c.tyaw += dt * 0.035;
		} else {
			c.tyaw = 0;
			c.tpitch = 0;
		}
		c.yaw = lerp(c.yaw, c.tyaw, k2);
		c.pitch = lerp(c.pitch, c.tpitch, k2);
		if (!this.three && Math.abs(c.yaw) < 0.001 && Math.abs(c.pitch) < 0.001) {
			c.yaw = 0;
			c.pitch = 0;
		}
	}

	// ---------------------------------------------------------------- frame
	private frame = (now: number) => {
		const dt = Math.min((now - this.last) / 1000, 0.05);
		this.last = now;
		this.time += dt;
		this.stepCamera(dt);
		for (const n of this.nodes.values()) {
			n.r = lerp(n.r, n.tr, 1 - Math.pow(0.02, dt));
			n.alpha = lerp(n.alpha, n.dead ? 0 : 1, 1 - Math.pow(0.03, dt));
		}
		for (const [id, n] of this.nodes) if (n.dead && n.alpha < 0.015 && id !== this.selected) this.nodes.delete(id);
		this.simulate();
		this.render();
		this.raf = requestAnimationFrame(this.frame);
	};

	private bezier(a: SNode, b: SNode, curv: number) {
		const mx = (a.sx + b.sx) / 2,
			my = (a.sy + b.sy) / 2;
		const dx = b.sx - a.sx,
			dy = b.sy - a.sy,
			len = Math.hypot(dx, dy) || 1;
		const sgn = a.id < b.id ? 1 : -1;
		return { cx: mx + (-dy / len) * len * curv * sgn, cy: my + (dx / len) * len * curv * sgn, len };
	}

	private render() {
		const { ctx, W, H, DPR, cam } = this;
		ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
		const bg = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
		bg.addColorStop(0, "#0b1020");
		bg.addColorStop(0.55, "#06091466");
		bg.addColorStop(1, "#05070d");
		ctx.fillStyle = "#05070d";
		ctx.fillRect(0, 0, W, H);
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, W, H);
		for (const s of this.stars) {
			const px = ((((s.x * W * 1.2 - cam.x * 0.02 * s.z * cam.zoom - cam.yaw * 120 * s.z) % (W * 1.2)) + W * 1.2) % (W * 1.2)) - W * 0.1;
			const py = ((((s.y * H * 1.2 - cam.y * 0.02 * s.z * cam.zoom - cam.pitch * 120 * s.z) % (H * 1.2)) + H * 1.2) % (H * 1.2)) - H * 0.1;
			ctx.globalAlpha = (0.25 + 0.5 * s.z) * (0.6 + 0.4 * Math.sin(this.time * 0.8 + s.p));
			ctx.fillStyle = "#cfe0ff";
			ctx.fillRect(px, py, 0.6 + s.z * 1.2, 0.6 + s.z * 1.2);
		}
		ctx.globalAlpha = 1;
		if (this.nodes.size === 0) return;

		for (const n of this.nodes.values()) this.project(n);
		const focusId = this.hover || this.selected;
		const related = new Set<string>();
		if (focusId) {
			related.add(focusId);
			for (const e of this.edges) {
				if (e.a.id === focusId) related.add(e.b.id);
				if (e.b.id === focusId) related.add(e.a.id);
			}
		}
		const dimOthers = !!focusId;
		const visible = (n: SNode) => !n.hidden && n.alpha > 0.02;

		// edges
		ctx.globalCompositeOperation = "lighter";
		ctx.lineCap = "round";
		const heavy = this.edges.length > 450;
		for (const e of this.edges) {
			const { a, b } = e;
			if (!visible(a) || !visible(b)) continue;
			const hl = !!focusId && (a.id === focusId || b.id === focusId);
			const dim = dimOthers && !hl;
			if (Math.max(a.sx, b.sx) < -50 || Math.min(a.sx, b.sx) > W + 50 || Math.max(a.sy, b.sy) < -50 || Math.min(a.sy, b.sy) > H + 50) continue;
			const c = this.bezier(a, b, 0.16);
			const base = 0.1 + 0.5 * e.norm;
			const alpha = Math.min(a.alpha, b.alpha) * (dim ? 0.05 : hl ? Math.min(base * 2.4, 0.95) : base);
			const lw = (0.5 + 3.2 * e.norm * e.norm) * clamp(cam.zoom * 1.4, 0.6, 2.2) * (hl ? 1.6 : 1);
			const grd = ctx.createLinearGradient(a.sx, a.sy, b.sx, b.sy);
			grd.addColorStop(0, rgba(KIND_META[a.kind].color, alpha * 0.35));
			grd.addColorStop(1, rgba(KIND_META[b.kind].color, alpha));
			ctx.strokeStyle = e.via ? rgba("#ffb454", alpha) : grd;
			ctx.lineWidth = lw;
			ctx.beginPath();
			ctx.moveTo(a.sx, a.sy);
			ctx.quadraticCurveTo(c.cx, c.cy, b.sx, b.sy);
			ctx.stroke();
			if (!dim && !(heavy && !hl && e.norm < 0.5) && c.len > 24) {
				const cnt = hl ? 4 : 1 + Math.floor(e.norm * 3);
				const pr = (0.8 + 1.6 * e.norm) * clamp(cam.zoom * 1.5, 0.7, 1.8) * (hl ? 1.3 : 1);
				ctx.fillStyle = rgba(e.via ? "#ffd9a0" : "#ffffff", Math.min(a.alpha, b.alpha) * (hl ? 0.95 : 0.7));
				for (let k = 0; k < cnt; k++) {
					const t = (e.phase + k / cnt + this.time * 0.045 * e.speed * (240 / Math.max(c.len, 120))) % 1;
					const u = 1 - t;
					const px = u * u * a.sx + 2 * u * t * c.cx + t * t * b.sx;
					const py = u * u * a.sy + 2 * u * t * c.cy + t * t * b.sy;
					ctx.beginPath();
					ctx.arc(px, py, pr, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		}
		ctx.globalCompositeOperation = "source-over";

		// nodes, depth sorted so 3D overlaps correctly
		const order = [...this.nodes.values()].filter(visible).sort((p, q) => q.sz - p.sz);
		for (const n of order) {
			const col = KIND_META[n.kind].color;
			const dim = dimOthers && !related.has(n.id);
			const depthFade = this.three ? clamp(1 - n.sz / 2200, 0.35, 1) : 1;
			const al = n.alpha * (dim ? 0.18 : 1) * depthFade;
			const pulse = n.kind === "mint" ? 1 + 0.08 * Math.sin(this.time * 1.4) : 1;
			const R = n.sr * pulse;
			if (n.sx < -R * 3 || n.sx > W + R * 3 || n.sy < -R * 3 || n.sy > H + R * 3) continue;
			ctx.globalAlpha = al * 0.9;
			const gs = R * 5;
			ctx.drawImage(this.sprite(n.kind), n.sx - gs, n.sy - gs, gs * 2, gs * 2);
			ctx.globalAlpha = al;
			const body = ctx.createRadialGradient(n.sx - R * 0.35, n.sy - R * 0.35, R * 0.1, n.sx, n.sy, R);
			body.addColorStop(0, "#ffffff");
			body.addColorStop(0.25, col);
			body.addColorStop(1, rgba(col, 0.55));
			ctx.fillStyle = body;
			ctx.beginPath();
			if (n.kind === "others") {
				ctx.setLineDash([4, 4]);
				ctx.strokeStyle = rgba(col, 0.8);
				ctx.lineWidth = 1.2;
				ctx.arc(n.sx, n.sy, R, 0, Math.PI * 2);
				ctx.stroke();
				ctx.setLineDash([]);
				ctx.fillStyle = rgba(col, 0.12);
				ctx.fill();
			} else {
				ctx.arc(n.sx, n.sy, R, 0, Math.PI * 2);
				ctx.fill();
			}
			if (n.kind === "mint") {
				ctx.strokeStyle = rgba("#ff4d6d", 0.9);
				ctx.lineWidth = 1.5;
				ctx.beginPath();
				ctx.arc(n.sx, n.sy, R + 5 + 2 * Math.sin(this.time * 1.4), 0, Math.PI * 2);
				ctx.stroke();
			}
			if (n.id === this.selected || n.id === this.hover || n.id === this.focus) {
				ctx.strokeStyle = "rgba(255,255,255,0.9)";
				ctx.lineWidth = 1.6;
				ctx.beginPath();
				ctx.arc(n.sx, n.sy, R + 4, 0, Math.PI * 2);
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
		}

		// labels, semantic zoom: more detail the closer you get
		ctx.textAlign = "center";
		ctx.textBaseline = "top";
		const placed: [number, number, number][] = [];
		for (const n of order.slice().sort((p, q) => q.sr - p.sr)) {
			const named = !!n.data.label;
			const show =
				n.id === this.hover ||
				n.id === this.selected ||
				n.id === this.focus ||
				n.sr > 22 ||
				(named && n.sr > 6) ||
				(cam.zoom > 0.9 && n.sr > (named ? 11 : 14));
			if (!show) continue;
			if (dimOthers && !related.has(n.id)) continue;
			const txt = n.data.label || shortAddr(n.id);
			const fs = clamp(10 + n.sr * 0.12, 10, 15);
			ctx.font = `${n.sr > 18 ? 600 : 500} ${fs}px ${this.font}`;
			const w = ctx.measureText(txt).width;
			const x = n.sx,
				y = n.sy + n.sr + 6;
			let hit = false;
			for (const p of placed) {
				if (Math.abs(p[0] - x) < (p[2] + w) / 2 && Math.abs(p[1] - y) < fs + 3) {
					hit = true;
					break;
				}
			}
			if (hit && n.id !== this.hover && n.id !== this.selected) continue;
			placed.push([x, y, w]);
			ctx.globalAlpha = n.alpha * (this.three ? clamp(1 - n.sz / 2200, 0.4, 1) : 1);
			ctx.lineWidth = 3.5;
			ctx.strokeStyle = "rgba(5,7,13,.92)";
			ctx.strokeText(txt, x, y);
			ctx.fillStyle = "#eef3ff";
			ctx.fillText(txt, x, y);
			if (n.sr > 24 && this.mode === "entities" && n.kind !== "mint" && n.kind !== "others") {
				ctx.font = `500 ${fs - 2}px ${this.font}`;
				ctx.fillStyle = "#9fb0d0";
				ctx.fillText(fmt(n.data.balance) + " · " + pct(n.data.share), x, y + fs + 1);
			}
			ctx.globalAlpha = 1;
		}
		this.drawMinimap();
	}

	private drawMinimap() {
		const mm = this.minimap;
		const g = this.mctx;
		if (!mm || !g) return;
		if (this.three || this.W < 900) {
			mm.style.display = "none";
			return;
		}
		mm.style.display = "block";
		const w = mm.clientWidth,
			h = mm.clientHeight;
		if (mm.width !== Math.round(w * this.DPR)) {
			mm.width = Math.round(w * this.DPR);
			mm.height = Math.round(h * this.DPR);
		}
		g.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
		g.clearRect(0, 0, w, h);
		const vis = [...this.nodes.values()].filter((n) => !n.dead && !n.hidden);
		if (!vis.length) return;
		const cam = this.cam;
		let minx = 1e9,
			maxx = -1e9,
			miny = 1e9,
			maxy = -1e9;
		for (const n of vis) {
			minx = Math.min(minx, n.x);
			maxx = Math.max(maxx, n.x);
			miny = Math.min(miny, n.y);
			maxy = Math.max(maxy, n.y);
		}
		const vx0 = cam.x - this.cx() / cam.zoom,
			vx1 = cam.x + (this.W - this.cx()) / cam.zoom,
			vy0 = cam.y - this.cy() / cam.zoom,
			vy1 = cam.y + (this.H - this.cy()) / cam.zoom;
		minx = Math.min(minx, vx0);
		maxx = Math.max(maxx, vx1);
		miny = Math.min(miny, vy0);
		maxy = Math.max(maxy, vy1);
		const sc = Math.min((w - 10) / (maxx - minx), (h - 10) / (maxy - miny));
		const ox = (w - (maxx - minx) * sc) / 2 - minx * sc,
			oy = (h - (maxy - miny) * sc) / 2 - miny * sc;
		this.mmMap = { sc, ox, oy };
		for (const n of vis) {
			g.fillStyle = KIND_META[n.kind].color;
			g.globalAlpha = 0.9;
			g.beginPath();
			g.arc(n.x * sc + ox, n.y * sc + oy, Math.max(1.2, n.r * sc * 0.6), 0, Math.PI * 2);
			g.fill();
		}
		g.globalAlpha = 1;
		g.strokeStyle = "rgba(255,255,255,.7)";
		g.lineWidth = 1;
		g.strokeRect(vx0 * sc + ox, vy0 * sc + oy, (vx1 - vx0) * sc, (vy1 - vy0) * sc);
	}

	// ---------------------------------------------------------------- input
	private nodeAt(mx: number, my: number): SNode | null {
		let best: SNode | null = null;
		let bd = 1e9;
		for (const n of this.nodes.values()) {
			if (n.hidden || n.alpha < 0.2) continue;
			const d = Math.hypot(n.sx - mx, n.sy - my);
			if (d <= n.sr + 5 && (d - n.sr < bd - (best ? best.sr : 0) || (best && n.sz < best.sz))) {
				best = n;
				bd = d;
			}
		}
		return best;
	}

	private local(e: { clientX: number; clientY: number }) {
		const r = this.canvas.getBoundingClientRect();
		return { x: e.clientX - r.left, y: e.clientY - r.top };
	}

	private onDown = (e: PointerEvent) => {
		const p = this.pointer;
		this.canvas.setPointerCapture(e.pointerId);
		p.pts.set(e.pointerId, [e.clientX, e.clientY]);
		p.down = true;
		p.x = e.clientX;
		p.y = e.clientY;
		p.moved = 0;
		p.button = e.button;
		const l = this.local(e);
		p.node = !this.three ? this.nodeAt(l.x, l.y) : null;
		if (p.node) {
			p.node.pinned = true;
			this.heat = Math.max(this.heat, 0.5);
		}
		this.canvas.style.cursor = "grabbing";
		if (p.pts.size === 2) {
			const [a, b] = [...p.pts.values()];
			p.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]);
		}
	};

	private onMove = (e: PointerEvent) => {
		const p = this.pointer;
		const cam = this.cam;
		if (p.pts.has(e.pointerId)) p.pts.set(e.pointerId, [e.clientX, e.clientY]);
		if (p.pts.size === 2) {
			const [a, b] = [...p.pts.values()];
			const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
			if (p.pinch) cam.zoom = clamp(cam.zoom * (d / p.pinch), 0.03, 12);
			p.pinch = d;
			this.camTween = null;
			return;
		}
		const l = this.local(e);
		if (!p.down) {
			const n = this.nodeAt(l.x, l.y);
			const id = n ? n.id : null;
			if (id !== this.hover) {
				this.hover = id;
				this.canvas.style.cursor = n ? "pointer" : "grab";
			}
			this.events.onHover(n ? { node: n.data, x: l.x, y: l.y } : null);
			return;
		}
		const dx = e.clientX - p.x,
			dy = e.clientY - p.y;
		p.x = e.clientX;
		p.y = e.clientY;
		p.moved += Math.abs(dx) + Math.abs(dy);
		this.camTween = null;
		if (p.node) {
			p.node.x += dx / cam.zoom;
			p.node.y += dy / cam.zoom;
			this.heat = Math.max(this.heat, 0.4);
		} else if (this.three && p.button === 0 && !e.shiftKey) {
			cam.tyaw += dx * 0.006;
			cam.yaw += dx * 0.006;
			cam.tpitch = clamp(cam.tpitch + dy * 0.006, -1.45, 1.45);
			cam.pitch = clamp(cam.pitch + dy * 0.006, -1.45, 1.45);
		} else {
			const cy = Math.cos(cam.yaw);
			cam.x -= dx / cam.zoom / (this.three ? Math.max(Math.abs(cy), 0.3) : 1);
			cam.y -= dy / cam.zoom;
		}
		this.events.onHover(null);
	};

	private onUp = (e: PointerEvent) => {
		const p = this.pointer;
		p.pts.delete(e.pointerId);
		p.pinch = 0;
		this.canvas.style.cursor = "grab";
		if (p.node) p.node.pinned = false;
		if (p.moved < 5) {
			const l = this.local(e);
			const n = this.nodeAt(l.x, l.y);
			if (n) {
				if (this.mode === "entities" && n.kind !== "others") this.events.onSelect(n.id);
			} else this.events.onSelect(null);
		}
		p.down = false;
		p.node = null;
	};

	private onLeave = () => {
		if (!this.pointer.down) {
			this.hover = null;
			this.events.onHover(null);
		}
	};

	private onDbl = (e: MouseEvent) => {
		const l = this.local(e);
		const n = this.nodeAt(l.x, l.y);
		if (!n) return;
		if (this.mode === "categories") this.events.onDive(n.id as GodEyeKind);
		else if (n.kind !== "others") this.events.onFocus(n.id);
	};

	private onWheel = (e: WheelEvent) => {
		e.preventDefault();
		this.camTween = null;
		const cam = this.cam;
		const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016));
		const nz = clamp(cam.zoom * f, 0.03, 12);
		if (!this.three) {
			// keep the point under the cursor fixed, like a map
			const l = this.local(e);
			const wx = cam.x + (l.x - this.cx()) / cam.zoom,
				wy = cam.y + (l.y - this.cy()) / cam.zoom;
			cam.zoom = nz;
			cam.x = wx - (l.x - this.cx()) / nz;
			cam.y = wy - (l.y - this.cy()) / nz;
		} else cam.zoom = nz;
	};

	private onMini = (e: PointerEvent) => {
		if (!this.mmMap || !this.minimap) return;
		const r = this.minimap.getBoundingClientRect();
		const { sc, ox, oy } = this.mmMap;
		this.camTween = { z: this.cam.zoom, x: (e.clientX - r.left - ox) / sc, y: (e.clientY - r.top - oy) / sc };
	};

	private bind() {
		const c = this.canvas;
		c.style.touchAction = "none";
		c.style.cursor = "grab";
		c.addEventListener("pointerdown", this.onDown);
		c.addEventListener("pointermove", this.onMove);
		c.addEventListener("pointerup", this.onUp);
		c.addEventListener("pointerleave", this.onLeave);
		c.addEventListener("dblclick", this.onDbl);
		c.addEventListener("wheel", this.onWheel, { passive: false });
		this.minimap?.addEventListener("pointerdown", this.onMini);
	}

	private unbind() {
		const c = this.canvas;
		c.removeEventListener("pointerdown", this.onDown);
		c.removeEventListener("pointermove", this.onMove);
		c.removeEventListener("pointerup", this.onUp);
		c.removeEventListener("pointerleave", this.onLeave);
		c.removeEventListener("dblclick", this.onDbl);
		c.removeEventListener("wheel", this.onWheel);
		this.minimap?.removeEventListener("pointerdown", this.onMini);
	}
}
