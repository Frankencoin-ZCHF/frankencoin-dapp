import { useEffect, useState } from "react";
import { FRANKENCOIN_API_CLIENT } from "../app.config";

export interface BackingPoint {
	/** unix milliseconds */
	t: number;
	/** ZCHF in circulation */
	supply: number;
	/** value of the collateral in all open positions, in CHF */
	collateral: number;
}

let cache: BackingPoint[] | null = null;
let inflight: Promise<BackingPoint[]> | null = null;

async function load(): Promise<BackingPoint[]> {
	const [supplyRes, ratioRes] = await Promise.all([
		FRANKENCOIN_API_CLIENT.get<Record<string, { created: number; supply: number }>>("/ecosystem/frankencoin/totalsupply"),
		FRANKENCOIN_API_CLIENT.get<{ collateralRatioBySupply?: Record<string, number> }>("/prices/history/ratio"),
	]);
	const supply = Object.values(supplyRes.data ?? {})
		.map((s) => [s.created * 1000, s.supply] as [number, number])
		.sort((a, b) => a[0] - b[0]);
	const ratio = Object.entries(ratioRes.data?.collateralRatioBySupply ?? {})
		.map(([t, r]) => [Number(t), r] as [number, number])
		.sort((a, b) => a[0] - b[0]);

	// the supply log only has an entry on days the supply changed, so carry the last value forward
	const points: BackingPoint[] = [];
	let i = 0;
	let current = 0;
	for (const [t, r] of ratio) {
		while (i < supply.length && supply[i][0] <= t) current = supply[i++][1];
		if (current > 0 && r > 0) points.push({ t, supply: current, collateral: current * r });
	}
	return points;
}

/**
 * ZCHF supply next to the value of the collateral behind it, per day. Supply from
 * /ecosystem/frankencoin/totalsupply, collateral as supply times the API's collateral-to-supply ratio
 * (/prices/history/ratio, the series behind the monitoring page's health chart). Empty until loaded.
 */
export function useBackingHistory(): BackingPoint[] {
	const [data, setData] = useState<BackingPoint[]>(cache ?? []);

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
