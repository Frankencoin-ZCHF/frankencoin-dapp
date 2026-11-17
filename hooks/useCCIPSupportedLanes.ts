import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { ADDRESS, ChainId, SupportedChainIds } from "@frankencoin/zchf";
import { WAGMI_CONFIG } from "../app.config";

const getSupportedChainsABI = [
	{
		name: "getSupportedChains",
		type: "function",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "", type: "uint64[]" }],
	},
] as const;

// chain selectors each pool has configured, keyed by chain id; chains whose pool could not be read are missing
type PoolLanes = Partial<Record<ChainId, Set<string>>>;

let cache: Promise<PoolLanes> | undefined;

const fetchPoolLanes = (): Promise<PoolLanes> => {
	if (!cache) {
		cache = Promise.all(
			SupportedChainIds.map(async (chainId) => {
				try {
					const selectors = await readContract(WAGMI_CONFIG, {
						address: ADDRESS[chainId].ccipTokenPool,
						chainId,
						abi: getSupportedChainsABI,
						functionName: "getSupportedChains",
					});
					return [chainId, new Set(selectors.map((s) => s.toString()))] as const;
				} catch (error) {
					console.error("useCCIPSupportedLanes", chainId, error);
					return [chainId, undefined] as const;
				}
			})
		)
			.then((entries) => {
				const lanes: PoolLanes = {};
				for (const [chainId, selectors] of entries) if (selectors) lanes[chainId] = selectors;
				return lanes;
			})
			.catch((error) => {
				cache = undefined;
				throw error;
			});
	}
	return cache;
};

/**
 * Chains that `sourceChainId` can send to over a direct CCIP lane, read from the token pools onchain.
 * A lane only counts when the source pool lists the destination and the destination pool lists the source.
 * Returns `undefined` while loading, or when a pool could not be read (callers must not restrict then).
 */
export function useCCIPSupportedDestinations(sourceChainId: ChainId): ChainId[] | undefined {
	const [lanes, setLanes] = useState<PoolLanes>();

	useEffect(() => {
		let cancelled = false;
		fetchPoolLanes().then((l) => !cancelled && setLanes(l));
		return () => {
			cancelled = true;
		};
	}, []);

	if (!lanes) return undefined;
	const sourceLanes = lanes[sourceChainId];
	if (!sourceLanes || !ADDRESS[sourceChainId]) return undefined;

	const sourceSelector = ADDRESS[sourceChainId].chainSelector;
	const destinations: ChainId[] = [];
	for (const destinationChainId of SupportedChainIds) {
		if (destinationChainId === sourceChainId) continue;
		const destinationLanes = lanes[destinationChainId];
		if (!destinationLanes) return undefined;
		if (sourceLanes.has(ADDRESS[destinationChainId].chainSelector) && destinationLanes.has(sourceSelector)) {
			destinations.push(destinationChainId);
		}
	}
	return destinations;
}
