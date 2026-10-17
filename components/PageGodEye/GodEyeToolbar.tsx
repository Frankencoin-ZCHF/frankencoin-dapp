import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { godeyeSearch } from "../../hooks/useGodEye";
import { KIND_META, WINDOWS } from "./godeye.constants";
import { shortAddr } from "./godeye.format";
import { GodEyeMode, GodEyeRank, GodEyeSearchHit, GodEyeTokenInfo } from "./godeye.types";
import { Dot, Glass, IconButton, Seg } from "./GodEyeUi";

const select = "rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs outline-none [&>option]:bg-[#0e121e]";

type Props = {
	tokens: GodEyeTokenInfo[];
	token: string;
	onToken: (k: string) => void;
	mode: GodEyeMode;
	onMode: (m: GodEyeMode) => void;
	rank: GodEyeRank;
	onRank: (r: GodEyeRank) => void;
	window: number;
	onWindow: (w: number) => void;
	top: number;
	onTop: (n: number) => void;
	three: boolean;
	onThree: () => void;
	onFit: () => void;
	onPick: (address: string) => void;
	focusActive: boolean;
};

export default function GodEyeToolbar(p: Props) {
	const [q, setQ] = useState("");
	const [hits, setHits] = useState<GodEyeSearchHit[]>([]);
	const [open, setOpen] = useState(false);
	const [topLocal, setTopLocal] = useState(p.top);
	const box = useRef<HTMLDivElement>(null);
	const input = useRef<HTMLInputElement>(null);

	useEffect(() => setTopLocal(p.top), [p.top]);

	useEffect(() => {
		const term = q.trim();
		if (term.length < 2) return setOpen(false);
		const t = setTimeout(async () => {
			try {
				const r = await godeyeSearch(term, p.token);
				if (!r.length && /^0x[0-9a-fA-F]{40}$/.test(term)) r.push({ address: term.toLowerCase(), label: null, kind: "wallet" });
				setHits(r);
				setOpen(true);
			} catch {
				/* ignore */
			}
		}, 160);
		return () => clearTimeout(t);
	}, [q, p.token]);

	useEffect(() => {
		const click = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
		const key = (e: KeyboardEvent) => {
			if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
				e.preventDefault();
				input.current?.focus();
			}
		};
		document.addEventListener("click", click);
		window.addEventListener("keydown", key);
		return () => {
			document.removeEventListener("click", click);
			window.removeEventListener("keydown", key);
		};
	}, []);

	const pick = (a: string) => {
		setOpen(false);
		setQ("");
		input.current?.blur();
		p.onPick(a);
	};

	return (
		<div className="pointer-events-none absolute left-3 right-3 top-3 z-20 flex flex-wrap items-center gap-2 [&>*]:pointer-events-auto">
			<Glass className="flex items-center gap-2.5 py-2 pl-2.5 pr-4">
				<Link href="/" title="Back to the app" className="mr-0.5 text-slate-400 hover:text-white">
					←
				</Link>
				<div className="h-6 w-6 rounded-full bg-[radial-gradient(circle,#05070d_0_22%,#ffd84d_23%_48%,#ff9d2e_49%_62%,transparent_63%)] shadow-[0_0_18px_rgba(255,216,77,0.55),inset_0_0_0_2px_rgba(94,200,255,0.65)]" />
				<div className="leading-tight">
					<div className="text-[13px] font-bold tracking-[0.18em]">GODEYE</div>
					<div className="text-[10px] text-slate-400">Frankencoin · fund flow</div>
				</div>
			</Glass>

			<Glass className="flex items-center gap-2 px-2 py-1.5">
				<select className={select} value={p.token} onChange={(e) => p.onToken(e.target.value)} title="Token ledger">
					{p.tokens.map((t) => (
						<option key={t.key} value={t.key}>
							{t.symbol} · {t.chain} ({t.transfers.toLocaleString()})
						</option>
					))}
				</select>
				<Seg
					value={p.mode}
					onChange={p.onMode}
					options={[
						{ value: "entities", label: "Entities" },
						{ value: "categories", label: "Categories" },
					]}
				/>
			</Glass>

			<Glass className="hidden items-center gap-2 px-2 py-1.5 md:flex">
				<span className="text-[10px] uppercase tracking-wider text-slate-500">Rank</span>
				<Seg
					value={p.rank}
					onChange={p.onRank}
					disabled={p.mode === "categories" || p.focusActive}
					options={[
						{ value: "balance", label: "Balance" },
						{ value: "volume", label: "Volume" },
					]}
				/>
				<span className="text-[10px] uppercase tracking-wider text-slate-500">Flow</span>
				<select className={select} value={p.window} onChange={(e) => p.onWindow(Number(e.target.value))}>
					{WINDOWS.map((w) => (
						<option key={w.value} value={w.value}>
							{w.label}
						</option>
					))}
				</select>
				<span className="text-[10px] uppercase tracking-wider text-slate-500">Nodes</span>
				<input
					type="range"
					min={15}
					max={300}
					step={5}
					value={topLocal}
					onChange={(e) => setTopLocal(Number(e.target.value))}
					onMouseUp={() => p.onTop(topLocal)}
					onTouchEnd={() => p.onTop(topLocal)}
					onKeyUp={() => p.onTop(topLocal)}
					className="w-24 accent-sky-400"
				/>
				<span className="w-8 rounded-lg border border-white/10 bg-white/5 py-0.5 text-center text-xs tabular-nums">{topLocal}</span>
				<IconButton onClick={p.onThree} active={p.three} title="Toggle 3D (3)">
					3D
				</IconButton>
				<IconButton onClick={p.onFit} title="Fit view (F)">
					Fit
				</IconButton>
			</Glass>

			<div ref={box} className="relative ml-auto">
				<input
					ref={input}
					value={q}
					onChange={(e) => setQ(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && hits[0]) pick(hits[0].address);
						if (e.key === "Escape") (setOpen(false), input.current?.blur());
					}}
					placeholder="Search address or label  ( / )"
					spellCheck={false}
					autoComplete="off"
					className="w-64 rounded-xl border border-white/10 bg-[#0e121e]/75 px-3 py-2 text-xs text-slate-200 outline-none backdrop-blur-xl placeholder:text-slate-500 focus:border-sky-400"
				/>
				{open && (
					<Glass className="absolute right-0 top-11 max-h-80 w-80 overflow-auto p-1">
						{hits.length === 0 && <div className="px-2 py-1.5 text-xs text-slate-400">No match</div>}
						{hits.map((h) => (
							<div key={h.address} onClick={() => pick(h.address)} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-sky-400/15">
								<span className="flex items-center gap-2">
									<Dot color={KIND_META[h.kind].color} size={7} />
									{h.label || shortAddr(h.address)}
								</span>
								<span className="font-mono text-[10px] text-slate-500">{shortAddr(h.address)}</span>
							</div>
						))}
					</Glass>
				)}
			</div>
		</div>
	);
}
