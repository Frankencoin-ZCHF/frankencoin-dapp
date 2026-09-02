import { sendTransaction, waitForTransactionReceipt } from "@wagmi/core";
import type { ApproveData, ApproveParams, RouteData, RouteParams } from "@ensofinance/sdk";
import { CONFIG, WAGMI_CONFIG } from "../app.config";

// Scaffolded Enso swap execution — an alternative to the CoW Protocol flow in cowSwap.ts.
// Stays off (and every call below throws) until NEXT_PUBLIC_ENSO_SWAP_ENABLED="true" and a
// server-side ENSO_API_KEY is configured; requests never hit Enso directly from the browser,
// they go through the /api/enso/* proxy routes so the API key stays server-only.
export const ENSO_SWAP_ENABLED = CONFIG.ensoSwapEnabled;

async function postEnso<T>(path: string, body: unknown): Promise<T> {
	if (!ENSO_SWAP_ENABLED) throw new Error('Enso swap execution is disabled (set NEXT_PUBLIC_ENSO_SWAP_ENABLED="true" to enable)');

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
// the tx returned by getEnsoRoute/getEnsoApproval is just a plain transaction send.
export async function sendEnsoTransaction(tx: RouteData["tx"] | ApproveData["tx"], chainId: number) {
	const hash = await sendTransaction(WAGMI_CONFIG, {
		chainId,
		to: tx.to,
		data: tx.data as `0x${string}`,
		value: "value" in tx && tx.value ? BigInt(tx.value) : 0n,
	});

	await waitForTransactionReceipt(WAGMI_CONFIG, { hash, chainId, confirmations: 1 });
	return hash;
}
