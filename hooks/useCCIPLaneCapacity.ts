import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { formatUnits } from "viem";
import { ADDRESS, ChainId } from "@frankencoin/zchf";
import { WAGMI_CONFIG } from "../app.config";
import { formatCurrency, FormatType } from "@utils";

/**
 * Token bucket state of one direction of a CCIP lane, as returned by the token pool.
 * `tokens` is the amount that can be bridged right now, it refills at `rate` per second up to `capacity`.
 */
export type CCIPRateLimiterState = {
	tokens: bigint;
	lastUpdated: number;
	isEnabled: boolean;
	capacity: bigint;
	rate: bigint;
};

export const ccipRateLimiterStateOutput = {
	type: "tuple",
	name: "",
	components: [
		{ name: "tokens", type: "uint128" },
		{ name: "lastUpdated", type: "uint32" },
		{ name: "isEnabled", type: "bool" },
		{ name: "capacity", type: "uint128" },
		{ name: "rate", type: "uint128" },
	],
} as const;

export const ccipTokenPoolRateLimitABI = [
	{
		name: "getCurrentInboundRateLimiterState",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "chain", type: "uint64" }],
		outputs: [ccipRateLimiterStateOutput],
	},
	{
		name: "getCurrentOutboundRateLimiterState",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "chain", type: "uint64" }],
		outputs: [ccipRateLimiterStateOutput],
	},
] as const;

export type CCIPLaneCapacity = {
	/** Outbound bucket on the source chain's pool, checked when the transfer is sent. */
	outbound: CCIPRateLimiterState | null;
	/** Inbound bucket on the destination chain's pool, checked when the message is delivered. */
	inbound: CCIPRateLimiterState | null;
	loaded: boolean;
};

const REFRESH_INTERVAL_MS = 30_000;

/**
 * Reads both rate limiter buckets of the lane from `sourceChainId` to `destinationChainId` directly from the token pools.
 * Returns empty state while loading or when both chains are the same.
 */
export function useCCIPLaneCapacity(sourceChainId: ChainId, destinationChainId: ChainId | undefined): CCIPLaneCapacity {
	const [state, setState] = useState<CCIPLaneCapacity>({ outbound: null, inbound: null, loaded: false });

	useEffect(() => {
		if (destinationChainId === undefined || destinationChainId === sourceChainId) {
			setState({ outbound: null, inbound: null, loaded: false });
			return;
		}

		const source = ADDRESS[sourceChainId];
		const destination = ADDRESS[destinationChainId];
		if (!source?.ccipTokenPool || !destination?.ccipTokenPool) {
			setState({ outbound: null, inbound: null, loaded: false });
			return;
		}

		let cancelled = false;

		const fetcher = async () => {
			try {
				const [outbound, inbound] = await Promise.all([
					readContract(WAGMI_CONFIG, {
						address: source.ccipTokenPool,
						chainId: sourceChainId,
						abi: ccipTokenPoolRateLimitABI,
						functionName: "getCurrentOutboundRateLimiterState",
						args: [BigInt(destination.chainSelector)],
					}),
					readContract(WAGMI_CONFIG, {
						address: destination.ccipTokenPool,
						chainId: destinationChainId,
						abi: ccipTokenPoolRateLimitABI,
						functionName: "getCurrentInboundRateLimiterState",
						args: [BigInt(source.chainSelector)],
					}),
				]);
				if (!cancelled) {
					setState({
						outbound: outbound as CCIPRateLimiterState,
						inbound: inbound as CCIPRateLimiterState,
						loaded: true,
					});
				}
			} catch (error) {
				console.error("useCCIPLaneCapacity", error);
			}
		};

		fetcher();
		const interval = setInterval(fetcher, REFRESH_INTERVAL_MS);

		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [sourceChainId, destinationChainId]);

	return state;
}

export const formatLaneAmount = (value: bigint) => formatCurrency(formatUnits(value, 18), 0, 0, FormatType.symbol);

/** Human readable duration until `amount` fits into the bucket, or null if it never will. */
export const laneRefillLabel = (state: CCIPRateLimiterState, amount: bigint): string | null => {
	if (amount <= state.tokens) return null;
	if (amount > state.capacity || state.rate == 0n) return null;
	const seconds = Number(amount - state.tokens) / Number(state.rate);
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.ceil((seconds % 3600) / 60);
	if (hours > 0) return `~${hours}h ${minutes}m`;
	return `~${Math.max(minutes, 1)}m`;
};

/** Summary of a bucket for display, e.g. "12'000 of 100'000 ZCHF". */
export const formatLaneState = (state: CCIPRateLimiterState | null): string => {
	if (!state) return "–";
	if (!state.isEnabled) return "Unlimited";
	const capacity = formatLaneAmount(state.capacity);
	if (state.tokens >= state.capacity) return `${capacity} ZCHF`;
	return `${formatLaneAmount(state.tokens)} of ${capacity} ZCHF`;
};
