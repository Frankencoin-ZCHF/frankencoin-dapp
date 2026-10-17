import { useCallback, useEffect, useRef, useState } from "react";
import { FRANKENCOIN_API_CLIENT } from "../app.config";
import {
	GodEyeAddress,
	GodEyeGraph,
	GodEyeHolders,
	GodEyeJourney,
	GodEyeMode,
	GodEyeRank,
	GodEyeSearchHit,
	GodEyeSync,
	GodEyeTimelinePoint,
	GodEyeTokenInfo,
} from "@components/PageGodEye/godeye.types";

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
	const clean = Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== ""));
	const r = await FRANKENCOIN_API_CLIENT.get<T>(`/godeye/${path}`, { params: clean });
	return r.data;
}

export const godeyeSearch = (q: string, token: string) => get<GodEyeSearchHit[]>("search", { q, token });

/**
 * Waits for the API to have mirrored the ERC20 ledger. The first start of the API takes a minute,
 * so this exposes the real sync progress instead of a blind spinner.
 */
export function useGodEyeBoot() {
	const [sync, setSync] = useState<GodEyeSync | null>(null);
	const [tokens, setTokens] = useState<GodEyeTokenInfo[]>([]);
	const [unreachable, setUnreachable] = useState<string | null>(null);

	useEffect(() => {
		let stop = false;
		let timer: ReturnType<typeof setTimeout>;
		const tick = async () => {
			try {
				const r = await get<{ sync: GodEyeSync; tokens: GodEyeTokenInfo[] }>("tokens");
				if (stop) return;
				setUnreachable(null);
				setSync(r.sync);
				if (r.sync.ready) {
					setTokens(r.tokens.filter((t) => t.transfers > 0));
					return;
				}
			} catch (e: any) {
				if (stop) return;
				setUnreachable(`${FRANKENCOIN_API_CLIENT.defaults.baseURL}/godeye/tokens failed (${e?.response?.status ?? "network error"}).`);
			}
			timer = setTimeout(tick, 1000);
		};
		tick();
		return () => {
			stop = true;
			clearTimeout(timer);
		};
	}, []);

	return { sync, tokens, ready: !!sync?.ready && tokens.length > 0, unreachable };
}

export function useGodEyeTimeline(token: string | null, version = 0) {
	const [timeline, setTimeline] = useState<GodEyeTimelinePoint[]>([]);
	useEffect(() => {
		if (!token) return;
		let stop = false;
		get<GodEyeTimelinePoint[]>("timeline", { token })
			.then((t) => !stop && setTimeline(t))
			.catch(() => !stop && setTimeline([]));
		return () => {
			stop = true;
		};
	}, [token, version]);
	return timeline;
}

export type GodEyeQuery = {
	token: string;
	at: number | null;
	window: number;
	top: number;
	rank: GodEyeRank;
	mode: GodEyeMode;
	focus: string | null;
};

/**
 * Loads graph + holders for a query. Single flight, latest wins: while a request is running newer
 * queries (scrubbing, playback) are collapsed into one follow-up request.
 */
export function useGodEyeScene(query: GodEyeQuery | null, refreshKey = 0) {
	const [scene, setScene] = useState<{ graph: GodEyeGraph; holders: GodEyeHolders; query: GodEyeQuery } | null>(null);
	const [error, setError] = useState<string | null>(null);
	const latest = useRef<GodEyeQuery | null>(null);
	const running = useRef(false);
	const dead = useRef(false);

	const run = useCallback(async () => {
		if (running.current) return;
		running.current = true;
		try {
			while (latest.current && !dead.current) {
				const q = latest.current;
				latest.current = null;
				try {
					const [graph, holders] = await Promise.all([
						get<GodEyeGraph>("graph", {
							token: q.token,
							at: q.at ?? undefined,
							window: q.window || undefined,
							top: q.top,
							rank: q.rank,
							mode: q.mode,
							focus: q.focus ?? undefined,
						}),
						get<GodEyeHolders>("holders", { token: q.token, at: q.at ?? undefined, limit: 20 }),
					]);
					if (!dead.current) {
						setScene({ graph, holders, query: q });
						setError(null);
					}
				} catch (e: any) {
					if (!dead.current) setError(e?.response?.data?.message ?? e?.message ?? "request failed");
				}
			}
		} finally {
			running.current = false;
		}
	}, []);

	const key = query ? JSON.stringify(query) : "";
	useEffect(() => {
		dead.current = false;
		return () => {
			dead.current = true;
		};
	}, []);
	useEffect(() => {
		if (!query) return;
		latest.current = query;
		run();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, refreshKey, run]);

	return { scene, error };
}

export function useGodEyeAddress(token: string | null, address: string | null) {
	const [data, setData] = useState<GodEyeAddress | null>(null);
	const [loading, setLoading] = useState(false);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		if (!token || !address) {
			setData(null);
			return;
		}
		let stop = false;
		setLoading(true);
		setFailed(false);
		get<GodEyeAddress>(`address/${address}`, { token })
			.then((a) => !stop && setData(a))
			.catch(() => !stop && (setData(null), setFailed(true)))
			.finally(() => !stop && setLoading(false));
		return () => {
			stop = true;
		};
	}, [token, address]);

	return { data, loading, failed };
}

export function useGodEyeJourney(token: string | null, address: string | null) {
	const [data, setData] = useState<GodEyeJourney | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!token || !address) return;
		let stop = false;
		setLoading(true);
		setError(null);
		get<GodEyeJourney>(`address/${address}/journey`, { token })
			.then((j) => !stop && setData(j))
			.catch((e) => !stop && (setData(null), setError(e?.response?.data?.message ?? e?.message ?? "request failed")))
			.finally(() => !stop && setLoading(false));
		return () => {
			stop = true;
		};
	}, [token, address]);

	return { data, loading, error };
}
