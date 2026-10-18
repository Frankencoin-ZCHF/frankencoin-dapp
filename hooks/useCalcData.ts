import { useEffect, useState } from "react";
import { CalcData, loadCalcData } from "../utils/calculator";

let cache: { at: number; value: CalcData } | null = null;
let inflight: Promise<CalcData> | null = null;
const TTL_MS = 5 * 60 * 1000;

/** Protocol history for the "what if" calculator, fetched once per 5 minutes and shared across components. */
export function useCalcData(): { data: CalcData | null; error: boolean } {
	const [data, setData] = useState<CalcData | null>(cache?.value ?? null);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (cache && Date.now() - cache.at < TTL_MS) {
			setData(cache.value);
			return;
		}
		inflight ??= loadCalcData()
			.then((v) => {
				cache = { at: Date.now(), value: v };
				return v;
			})
			.finally(() => (inflight = null));
		let alive = true;
		inflight.then((v) => alive && setData(v)).catch(() => alive && setError(true));
		return () => {
			alive = false;
		};
	}, []);

	return { data, error };
}
