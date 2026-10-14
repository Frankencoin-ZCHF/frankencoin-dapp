import { ReactNode } from "react";

export const GLASS = "bg-[#0e121e]/75 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 text-slate-200";

export function Glass({ className = "", children }: { className?: string; children: ReactNode }) {
	return <div className={`${GLASS} ${className}`}>{children}</div>;
}

export function Seg<T extends string>({
	value,
	options,
	onChange,
	disabled,
}: {
	value: T;
	options: { value: T; label: string }[];
	onChange: (v: T) => void;
	disabled?: boolean;
}) {
	return (
		<div className={`inline-flex rounded-lg bg-white/5 p-0.5 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
			{options.map((o) => (
				<button
					key={o.value}
					onClick={() => onChange(o.value)}
					className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
						value === o.value ? "bg-sky-400/20 text-white ring-1 ring-sky-400/40" : "text-slate-400 hover:text-slate-100"
					}`}
				>
					{o.label}
				</button>
			))}
		</div>
	);
}

export function IconButton({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: ReactNode; title?: string }) {
	return (
		<button
			onClick={onClick}
			title={title}
			className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
				active ? "bg-sky-400/20 border-sky-400/50 text-white" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
			}`}
		>
			{children}
		</button>
	);
}

export function StatCard({ label, value, sub, valueClass = "" }: { label: string; value: ReactNode; sub?: ReactNode; valueClass?: string }) {
	return (
		<div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
			<div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
			<div className={`text-lg font-semibold tabular-nums ${valueClass}`}>{value}</div>
			{sub && <div className="text-[10px] text-slate-500">{sub}</div>}
		</div>
	);
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
	return (
		<div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
			<span>{children}</span>
			{right && <span className="normal-case tracking-normal font-normal">{right}</span>}
		</div>
	);
}

export function Dot({ color, size = 10 }: { color: string; size?: number }) {
	return <span className="inline-block shrink-0 rounded-full" style={{ width: size, height: size, background: color, boxShadow: `0 0 8px ${color}` }} />;
}
