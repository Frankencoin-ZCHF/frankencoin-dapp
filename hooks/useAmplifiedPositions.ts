import { useEffect, useMemo, useState } from "react";
import { useBlockNumber, useConnection, useReadContracts } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { Address, encodePacked, keccak256, parseAbiItem, zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { UniswapV3PoolABI } from "@frankencoin/zchf";
import { decodeBigIntCall } from "@utils";
import { WAGMI_CONFIG } from "../app.config";
import { AmplifiedPositionABI, UniswapAmplifierABI } from "../abis/UniswapAmplifier";
import { getPendingFees } from "../utils/uniswapV3Math";

export type AmplifiedPositionInfo = {
	address: Address;
	created: bigint;
	tickLow: number;
	tickHigh: number;
	borrowed: bigint;
	liquidity: bigint;
	owner: Address;
};

export type AmplifiedPositionsResult = {
	positions: AmplifiedPositionInfo[];
	isLoading: boolean;
	apiError: string;
};

const POSITION_CREATED_EVENT = parseAbiItem("event AmplifiedPositionCreated(address position)");

/**
 * Loads every AmplifiedPosition ever created by the given amplifier, regardless of owner, by
 * reading its AmplifiedPositionCreated events. Positions belonging to the acting account
 * (`overwrite` or the connected wallet) are sorted to the top. Positions created in the current
 * session can be passed in as `extra` since the events may take a block to be indexed.
 */
export const useAmplifiedPositions = (
	amplifier: Address | undefined,
	extra: Address[] = [],
	overwrite?: Address
): AmplifiedPositionsResult => {
	const chainId = mainnet.id;
	const { address: connected } = useConnection();
	const account = (overwrite ?? connected)?.toLowerCase();
	const [createdList, setCreatedList] = useState<{ address: Address; block: bigint }[]>([]);
	const [logError, setLogError] = useState("");
	const [logLoading, setLogLoading] = useState(false);

	// enumerate all positions from the amplifier's creation events
	useEffect(() => {
		if (!amplifier) {
			setCreatedList([]);
			return;
		}
		const client = getPublicClient(WAGMI_CONFIG, { chainId });
		if (!client) return;
		let cancelled = false;
		setLogLoading(true);
		client
			.getLogs({ address: amplifier, event: POSITION_CREATED_EVENT, fromBlock: 0n, toBlock: "latest" })
			.then((logs) => {
				if (cancelled) return;
				setCreatedList(logs.map((log) => ({ address: log.args.position as Address, block: log.blockNumber ?? 0n })));
				setLogError("");
			})
			.catch(() => {
				if (!cancelled) setLogError("Could not load positions from the blockchain.");
			})
			.finally(() => {
				if (!cancelled) setLogLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [amplifier, chainId]);

	// merge in session-created positions (newest, hence a large sentinel block), deduplicated
	const candidates = useMemo(() => {
		const seen = new Set<string>();
		const out: { address: Address; created: bigint }[] = [];
		for (const { address, block } of createdList) {
			const key = address.toLowerCase();
			if (!seen.has(key)) {
				seen.add(key);
				out.push({ address, created: block });
			}
		}
		for (const address of extra) {
			const key = address.toLowerCase();
			if (!seen.has(key)) {
				seen.add(key);
				out.push({ address, created: 2n ** 63n });
			}
		}
		return out;
	}, [createdList, extra]);

	// load the state and owner of each position, refreshed every block
	const { data: blockNumber } = useBlockNumber({ watch: true });
	const { data: stateData, refetch, isLoading: stateLoading } = useReadContracts({
		contracts: candidates.flatMap(({ address }) => [
			{ chainId, address, abi: AmplifiedPositionABI, functionName: "tickLow" } as const,
			{ chainId, address, abi: AmplifiedPositionABI, functionName: "tickHigh" } as const,
			{ chainId, address, abi: AmplifiedPositionABI, functionName: "borrowed" } as const,
			{ chainId, address, abi: AmplifiedPositionABI, functionName: "totalLiquidity" } as const,
			{ chainId, address, abi: AmplifiedPositionABI, functionName: "owner" } as const,
		]),
		query: { enabled: candidates.length > 0 },
	});

	useEffect(() => {
		if (candidates.length > 0) refetch();
	}, [blockNumber, candidates.length, refetch]);

	const positions = useMemo(() => {
		if (!stateData) return [];
		const list = candidates.map(({ address, created }, i) => ({
			address,
			created,
			tickLow: Number(stateData[i * 5]?.result ?? 0),
			tickHigh: Number(stateData[i * 5 + 1]?.result ?? 0),
			borrowed: decodeBigIntCall(stateData[i * 5 + 2]),
			liquidity: decodeBigIntCall(stateData[i * 5 + 3]),
			owner: (stateData[i * 5 + 4]?.result as Address) ?? zeroAddress,
		}));
		// acting account's positions first, then everyone else's, each group oldest-first
		return list.sort((a, b) => {
			const aOwn = !!account && a.owner.toLowerCase() === account;
			const bOwn = !!account && b.owner.toLowerCase() === account;
			if (aOwn !== bOwn) return aOwn ? -1 : 1;
			return a.created < b.created ? -1 : 1;
		});
	}, [candidates, stateData, account]);

	return {
		positions,
		isLoading: logLoading || (candidates.length > 0 && stateLoading),
		apiError: logError,
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
						owner: (data![5]?.result as Address) ?? zeroAddress,
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
