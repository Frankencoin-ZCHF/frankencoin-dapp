import { useEffect, useState } from "react";

export interface UsdChfSince {
	/** CHF per 1 USD on the first ECB trading day of January 2023 */
	start: number;
	startDate: string;
	/** CHF per 1 USD at the latest ECB fixing */
	now: number;
	nowDate: string;
	/** change of the dollar against the franc over the period, as a fraction (negative = dollar lost) */
	change: number;
}

const FX = "https://api.frankfurter.dev/v1";
let cache: UsdChfSince | null = null;
let inflight: Promise<UsdChfSince> | null = null;

async function load(): Promise<UsdChfSince> {
	const [a, b] = await Promise.all([
		fetch(`${FX}/2023-01-02..2023-01-10?base=USD&symbols=CHF`).then((r) => r.json()),
		fetch(`${FX}/latest?base=USD&symbols=CHF`).then((r) => r.json()),
	]);
	const startDate = Object.keys(a?.rates ?? {}).sort()[0];
	const start = Number(a?.rates?.[startDate]?.CHF);
	const now = Number(b?.rates?.CHF);
	if (!(start > 0) || !(now > 0)) throw new Error("no USD/CHF rates");
	return { start, startDate, now, nowDate: String(b.date), change: now / start - 1 };
}

/**
 * US dollar against the Swiss franc since the start of 2023, from ECB reference rates (frankfurter.dev,
 * the source frankencoin.com uses for its USD/CHF history). Null while loading or when the read fails.
 */
export function useUsdChfSince(): UsdChfSince | null {
	const [data, setData] = useState<UsdChfSince | null>(cache);

	useEffect(() => {
		if (cache) return;
		inflight ??= load()
			.then((v) => (cache = v))
			.finally(() => (inflight = null));
		let alive = true;
		inflight.then((v) => alive && setData(v)).catch(() => undefined);
		return () => {
			alive = false;
		};
	}, []);

	return data;
}
