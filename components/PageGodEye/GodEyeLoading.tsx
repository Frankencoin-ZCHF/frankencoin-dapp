import { GodEyeSync } from "./godeye.types";
import { Glass } from "./GodEyeUi";

export default function GodEyeLoading({ sync, unreachable }: { sync: GodEyeSync | null; unreachable: string | null }) {
	const phase =
		sync?.phase === "positions"
			? "Reading positions"
			: sync?.phase === "ledgers"
				? "Mirroring ERC20 transfers from the indexer"
				: "Waiting for the first sync";
	const pct = sync && sync.target ? Math.max(sync.progress * 100, 2) : 2;

	return (
		<div className="absolute inset-0 z-30 flex items-center justify-center">
			<Glass className="w-[360px] max-w-[90%] p-6 text-center">
				<div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-sky-400" />
				<div className="font-semibold">{unreachable ? "Cannot reach the GodEye API…" : phase}</div>
				<div className="mt-1 text-xs text-slate-400">One-off when the API starts, afterwards it only fetches new transfers.</div>
				{!unreachable && (
					<>
						<div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
							<div
								className="h-full rounded-full bg-gradient-to-r from-sky-400 to-yellow-300 shadow-[0_0_12px_rgba(94,200,255,0.6)] transition-all duration-500"
								style={{ width: `${pct}%` }}
							/>
						</div>
						<div className={`mt-2 text-xs tabular-nums ${sync?.lastError ? "text-rose-400" : "text-slate-400"}`}>
							{sync?.lastError
								? `Sync error: ${sync.lastError} (retrying every minute)`
								: sync?.target
									? `${Math.round(sync.progress * 100)}% · ${sync.done.toLocaleString()} / ${sync.target.toLocaleString()} transfers`
									: "Contacting indexer…"}
						</div>
					</>
				)}
				{unreachable && <div className="mt-3 text-xs text-rose-400">{unreachable} Is the API running? Retrying…</div>}
			</Glass>
		</div>
	);
}
