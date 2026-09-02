import { sendTransaction } from "@wagmi/core";
import type { ApproveData, ApproveParams, RouteData, RouteParams } from "@ensofinance/sdk";
import { WAGMI_CONFIG } from "../app.config";

// Enso swap execution — an alternative to the CoW Protocol flow in cowSwap.ts, toggled
// per-session on the migration page. Requests never hit Enso directly from the browser, they
// go through the /api/enso/* proxy routes so the API key stays server-only; those routes 501
// if ENSO_API_KEY isn't configured server-side.
async function postEnso<T>(path: string, body: unknown): Promise<T> {
	const res = await fetch(path, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	const data = await res.json();
	if (!res.ok) throw new Error(data?.error ?? `Enso request to ${path} failed with status ${res.status}`);

	return data as T;
}

// Best route from one (or several) tokens into a destination token, with a ready-to-send tx.
export function getEnsoRoute(params: RouteParams): Promise<RouteData> {
	return postEnso<RouteData>("/api/enso/route", params);
}

// Approval tx for the spender Enso's route for `params.chainId` / routing strategy requires.
export function getEnsoApproval(params: ApproveParams): Promise<ApproveData> {
	return postEnso<ApproveData>("/api/enso/approve", params);
}

// Enso routes execute atomically onchain (unlike CoW's async solver settlement), so submitting
// the tx returned by getEnsoRoute/getEnsoApproval is just a plain transaction send. Callers
// await confirmation themselves (e.g. via toast.promise) so the tx hash is available immediately.
export function sendEnsoTransaction(tx: RouteData["tx"] | ApproveData["tx"], chainId: number) {
	return sendTransaction(WAGMI_CONFIG, {
		chainId,
		to: tx.to,
		data: tx.data as `0x${string}`,
		value: "value" in tx && tx.value ? BigInt(tx.value) : 0n,
	});
}
