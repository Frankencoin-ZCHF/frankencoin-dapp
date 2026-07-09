import { useEffect, useMemo, useState } from "react";
import { useBlockNumber, useConnection, useReadContracts } from "wagmi";
import { Address, encodePacked, isAddress, keccak256 } from "viem";
import { mainnet } from "viem/chains";
import axios from "axios";
import { UniswapV3PoolABI } from "@frankencoin/zchf";
import { decodeBigIntCall } from "@utils";
import { AmplifiedPositionABI, UniswapAmplifierABI } from "../abis/UniswapAmplifier";
import { getPendingFees } from "../utils/uniswapV3Math";

export type AmplifiedPositionInfo = {
	address: Address;
	created: bigint;
	tickLow: number;
	tickHigh: number;
	borrowed: bigint;
	liquidity: bigint;
};

export type AmplifiedPositionsResult = {
	positions: AmplifiedPositionInfo[];
	isLoading: boolean;
	apiError: string;
};

const AKTIONARIAT_OWNER_API = "https://api.aktionariat.com/owner";

/**
 * Finds the AmplifiedPosition contracts of the connected user that belong to the given amplifier.
 *
 * The list of candidate contracts owned by the user comes from the Aktionariat API. Contracts the
 * user created in this session can be passed in as `extra` since the API only picks them up with
 * a delay. Candidates are then filtered on-chain via the amplifier's positionCreationDate mapping.
 * An `overwrite` address shows the positions of that owner instead of the connected wallet.
 */
export const useAmplifiedPositions = (
	amplifier: Address | undefined,
	extra: Address[] = [],
	overwrite?: Address
): AmplifiedPositionsResult => {
	const chainId = mainnet.id;
	const { address: connected } = useConnection();
	const account = overwrite ?? connected;
	const [owned, setOwned] = useState<Address[]>([]);
	const [apiError, setApiError] = useState("");
	const [apiLoading, setApiLoading] = useState(false);

	useEffect(() => {
		if (!account) {
			setOwned([]);
			return;
		}
		let cancelled = false;
		setApiLoading(true);
		axios
			.get<string[]>(AKTIONARIAT_OWNER_API, { params: { address: account } })
			.then((response) => {
				if (cancelled) return;
				const addresses = response.data
					.filter((entry) => entry.startsWith("mainnet-"))
					.map((entry) => entry.slice("mainnet-".length))
					.filter((addr) => isAddress(addr)) as Address[];
				setOwned(addresses);
				setApiError("");
			})
			.catch(() => {
				if (!cancelled) setApiError("Could not load your contracts from the Aktionariat API.");
			})
			.finally(() => {
				if (!cancelled) setApiLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [account]);

	const candidates = useMemo(() => {
		const seen = new Set<string>();
		return [...owned, ...extra].filter((addr) => {
			const key = addr.toLowerCase();
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}, [owned, extra]);

	// step 1: which of the user's contracts were created by this amplifier?
	const { data: creationData, isLoading: creationLoading } = useReadContracts({
		contracts: candidates.map((candidate) => ({
			chainId,
			address: amplifier,
			abi: UniswapAmplifierABI,
			functionName: "positionCreationDate",
			args: [candidate],
		})),
		query: { enabled: !!amplifier && candidates.length > 0 },
	});

	const amplified = useMemo(() => {
		if (!creationData) return [];
		return candidates
			.map((address, i) => ({ address, created: decodeBigIntCall(creationData[i]) }))
			.filter((c) => c.created > 0n)
			.sort((a, b) => (a.created < b.created ? -1 : 1));
	}, [candidates, creationData]);

	// step 2: load the state of each amplified position, refreshed every block
	const { data: blockNumber } = useBlockNumber({ watch: true });
	const { data: stateData, refetch, isLoading: stateLoading } = useReadContracts({
		contracts: amplified.flatMap(({ address }) => [
			{ chainId, address, abi: AmplifiedPositionABI, functionName: "tickLow" } as const,
			{ chainId, address, abi: AmplifiedPositionABI, functionName: "tickHigh" } as const,
			{ chainId, address, abi: AmplifiedPositionABI, functionName: "borrowed" } as const,
			{ chainId, address, abi: AmplifiedPositionABI, functionName: "totalLiquidity" } as const,
		]),
		query: { enabled: amplified.length > 0 },
	});

	useEffect(() => {
		if (amplified.length > 0) refetch();
	}, [blockNumber, amplified.length, refetch]);

	const positions = useMemo(() => {
		if (!stateData) return [];
		return amplified.map(({ address, created }, i) => ({
			address,
			created,
			tickLow: Number(stateData[i * 4]?.result ?? 0),
			tickHigh: Number(stateData[i * 4 + 1]?.result ?? 0),
			borrowed: decodeBigIntCall(stateData[i * 4 + 2]),
			liquidity: decodeBigIntCall(stateData[i * 4 + 3]),
		}));
	}, [amplified, stateData]);

	return {
		positions,
		isLoading: apiLoading || (candidates.length > 0 && creationLoading) || (amplified.length > 0 && stateLoading),
		apiError,
	};
};

export type AmplifiedPositionResult = {
	isLoading: boolean;
	exists: boolean | undefined; // undefined while loading
	owner: Address | undefined;
	position: AmplifiedPositionInfo | undefined;
};

/**
 * Loads the state of a single AmplifiedPosition, verifying on-chain that it was
 * created by the given amplifier. Refreshed every block.
 */
export const useAmplifiedPosition = (amplifier: Address | undefined, position: Address | undefined): AmplifiedPositionResult => {
	const chainId = mainnet.id;
	const enabled = !!amplifier && !!position;

	const { data: blockNumber } = useBlockNumber({ watch: true });
	const { data, refetch, isLoading } = useReadContracts({
		contracts: [
			{ chainId, address: amplifier, abi: UniswapAmplifierABI, functionName: "positionCreationDate", args: [position!] },
			{ chainId, address: position, abi: AmplifiedPositionABI, functionName: "tickLow" },
			{ chainId, address: position, abi: AmplifiedPositionABI, functionName: "tickHigh" },
			{ chainId, address: position, abi: AmplifiedPositionABI, functionName: "borrowed" },
			{ chainId, address: position, abi: AmplifiedPositionABI, functionName: "totalLiquidity" },
			{ chainId, address: position, abi: AmplifiedPositionABI, functionName: "owner" },
		],
		query: { enabled },
	});

	useEffect(() => {
		if (enabled) refetch();
	}, [blockNumber, enabled, refetch]);

	const created = data ? decodeBigIntCall(data[0]) : 0n;
	const exists = data ? created > 0n : undefined;

	return {
		isLoading,
		exists,
		owner: data?.[5]?.result as Address | undefined,
		position:
			position && exists
				? {
						address: position,
						created,
						tickLow: Number(data![1]?.result ?? 0),
						tickHigh: Number(data![2]?.result ?? 0),
						borrowed: decodeBigIntCall(data![3]),
						liquidity: decodeBigIntCall(data![4]),
				  }
				: undefined,
	};
};

export type AmplifiedPositionFees = {
	isLoading: boolean;
	fees0: bigint; // accrued but uncollected fees in token0
	fees1: bigint; // accrued but uncollected fees in token1
};

/**
 * Computes the fees a position could collect right now, replicating the pool's
 * fee growth accounting. Refreshed every block.
 */
export const useAmplifiedPositionFees = (
	pool: Address | undefined,
	currentTick: number,
	position: AmplifiedPositionInfo | undefined
): AmplifiedPositionFees => {
	const chainId = mainnet.id;
	const enabled = !!pool && !!position;
	const positionKey = position
		? keccak256(encodePacked(["address", "int24", "int24"], [position.address, position.tickLow, position.tickHigh]))
		: undefined;

	const { data: blockNumber } = useBlockNumber({ watch: true });
	const { data, refetch, isLoading } = useReadContracts({
		contracts: [
			{ chainId, address: pool, abi: UniswapV3PoolABI, functionName: "feeGrowthGlobal0X128" },
			{ chainId, address: pool, abi: UniswapV3PoolABI, functionName: "feeGrowthGlobal1X128" },
			{ chainId, address: pool, abi: UniswapV3PoolABI, functionName: "ticks", args: [position?.tickLow ?? 0] },
			{ chainId, address: pool, abi: UniswapV3PoolABI, functionName: "ticks", args: [position?.tickHigh ?? 0] },
			{ chainId, address: pool, abi: UniswapV3PoolABI, functionName: "positions", args: [positionKey!] },
		],
		query: { enabled },
	});

	useEffect(() => {
		if (enabled) refetch();
	}, [blockNumber, enabled, refetch]);

	if (!position || !data || data.some((d) => d.status === "failure")) {
		return { isLoading, fees0: 0n, fees1: 0n };
	}

	const global0 = decodeBigIntCall(data[0]);
	const global1 = decodeBigIntCall(data[1]);
	const lowerTick = data[2].result as readonly [bigint, bigint, bigint, bigint, bigint, bigint, number, boolean];
	const upperTick = data[3].result as readonly [bigint, bigint, bigint, bigint, bigint, bigint, number, boolean];
	const poolPosition = data[4].result as readonly [bigint, bigint, bigint, bigint, bigint];
	const [liquidity, inside0Last, inside1Last, owed0, owed1] = poolPosition;

	return {
		isLoading,
		fees0: getPendingFees(currentTick, position.tickLow, position.tickHigh, liquidity, global0, lowerTick[2], upperTick[2], inside0Last, owed0),
		fees1: getPendingFees(currentTick, position.tickLow, position.tickHigh, liquidity, global1, lowerTick[3], upperTick[3], inside1Last, owed1),
	};
};
