import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlockNumber } from "wagmi";
import { readContracts } from "wagmi/actions";
import { Address, erc20Abi } from "viem";
import { mainnet } from "viem/chains";
import { PositionQuery } from "@frankencoin/api";
import { PositionV1ABI, PositionV2ABI } from "@frankencoin/zchf";
import { WAGMI_CONFIG } from "../app.config";

/**
 * The mutable part of a position, read directly from the chain.
 *
 * The indexer (ponder -> api.frankencoin.com) is the source for discovery, lists and history and is allowed to lag.
 * Anything that ends up in a transaction argument or a safety check must come from here instead.
 */
export type PositionLiveState = {
	minted: bigint;
	price: bigint;
	collateralBalance: bigint;
	challengedAmount: bigint;
	cooldown: number;
	expiration: number;
	closed: boolean;
	owner: Address;
	annualInterestPPM: number;
	limit: bigint;
	/** V1: limitForClones(), V2: availableForClones() */
	availableForClones: bigint;
	/** V1: limit - minted, V2: availableForMinting() */
	availableForMinting: bigint;
};

/** The subset of live fields that, if changed, invalidate a form that was seeded from the position. */
export type PositionLiveSnapshot = Pick<PositionLiveState, "minted" | "price" | "collateralBalance">;

export function snapshotOf(position: PositionQuery | PositionLiveState): PositionLiveSnapshot {
	return {
		minted: BigInt(position.minted),
		price: BigInt(position.price),
		collateralBalance: BigInt(position.collateralBalance),
	};
}

export function isSameSnapshot(a: PositionLiveSnapshot | undefined, b: PositionLiveSnapshot | undefined): boolean {
	if (!a || !b) return false;
	return a.minted === b.minted && a.price === b.price && a.collateralBalance === b.collateralBalance;
}

type PositionRef = Pick<PositionQuery, "position" | "collateral" | "version">;

/** One multicall for all mutable getters of a position. Usable outside React, e.g. right before signing. */
export async function readPositionLive(position: PositionRef, chainId: number = mainnet.id): Promise<PositionLiveState> {
	const address = position.position;
	const balanceCall = {
		chainId,
		address: position.collateral,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [address],
	} as const;

	if (position.version === 1) {
		const abi = PositionV1ABI;
		const [
			minted,
			price,
			challengedAmount,
			cooldown,
			expiration,
			closed,
			owner,
			annualInterestPPM,
			limit,
			limitForClones,
			collateralBalance,
		] = await readContracts(WAGMI_CONFIG, {
			allowFailure: false,
			contracts: [
				{ chainId, address, abi, functionName: "minted" },
				{ chainId, address, abi, functionName: "price" },
				{ chainId, address, abi, functionName: "challengedAmount" },
				{ chainId, address, abi, functionName: "cooldown" },
				{ chainId, address, abi, functionName: "expiration" },
				{ chainId, address, abi, functionName: "isClosed" },
				{ chainId, address, abi, functionName: "owner" },
				{ chainId, address, abi, functionName: "annualInterestPPM" },
				{ chainId, address, abi, functionName: "limit" },
				{ chainId, address, abi, functionName: "limitForClones" },
				balanceCall,
			],
		});
		return {
			minted,
			price,
			challengedAmount,
			cooldown: Number(cooldown),
			expiration: Number(expiration),
			closed,
			owner,
			annualInterestPPM: Number(annualInterestPPM),
			limit,
			availableForClones: limitForClones,
			availableForMinting: limit > minted ? limit - minted : 0n,
			collateralBalance,
		};
	} else {
		const abi = PositionV2ABI;
		const [
			minted,
			price,
			challengedAmount,
			cooldown,
			expiration,
			closed,
			owner,
			annualInterestPPM,
			limit,
			availableForClones,
			availableForMinting,
			collateralBalance,
		] = await readContracts(WAGMI_CONFIG, {
			allowFailure: false,
			contracts: [
				{ chainId, address, abi, functionName: "minted" },
				{ chainId, address, abi, functionName: "price" },
				{ chainId, address, abi, functionName: "challengedAmount" },
				{ chainId, address, abi, functionName: "cooldown" },
				{ chainId, address, abi, functionName: "expiration" },
				{ chainId, address, abi, functionName: "isClosed" },
				{ chainId, address, abi, functionName: "owner" },
				{ chainId, address, abi, functionName: "annualInterestPPM" },
				{ chainId, address, abi, functionName: "limit" },
				{ chainId, address, abi, functionName: "availableForClones" },
				{ chainId, address, abi, functionName: "availableForMinting" },
				balanceCall,
			],
		});
		return {
			minted,
			price,
			challengedAmount,
			cooldown: Number(cooldown),
			expiration: Number(expiration),
			closed,
			owner,
			annualInterestPPM: Number(annualInterestPPM),
			limit,
			availableForClones,
			availableForMinting,
			collateralBalance,
		};
	}
}

/** Overlays the live on-chain fields over the indexed record, keeping the indexed shape. */
export function mergePositionLive(position: PositionQuery, live: PositionLiveState): PositionQuery {
	const common = {
		minted: live.minted.toString(),
		price: live.price.toString(),
		collateralBalance: live.collateralBalance.toString(),
		cooldown: live.cooldown,
		expiration: live.expiration,
		closed: live.closed,
		owner: live.owner,
		annualInterestPPM: live.annualInterestPPM,
		limitForPosition: live.limit.toString(),
	};
	if (position.version === 1) {
		return {
			...position,
			...common,
			limitForClones: live.availableForClones.toString(),
			availableForClones: live.availableForClones.toString(),
			availableForPosition: live.availableForMinting.toString(),
		};
	} else {
		return {
			...position,
			...common,
			availableForClones: live.availableForClones.toString(),
			availableForMinting: live.availableForMinting.toString(),
		};
	}
}

type Options = {
	/** Refresh on every new block while the tab is visible. Default true. Reads on mount and on tab focus happen regardless. */
	watch?: boolean;
	chainId?: number;
};

/**
 * Live on-chain view of a position, merged over the indexed record from the API.
 *
 * Reads on mount, whenever the tab becomes visible again and (by default) on every new block while visible.
 * `refetch` returns the freshly read state and is meant to be awaited right before signing a transaction.
 */
export function usePositionLive(indexed: PositionQuery | undefined, options: Options = {}) {
	const { watch = true, chainId = mainnet.id } = options;
	const address = indexed?.position;
	const collateral = indexed?.collateral;
	const version = indexed?.version;

	const [live, setLive] = useState<PositionLiveState>();
	const [error, setError] = useState<Error>();
	const [updatedAt, setUpdatedAt] = useState<number>();
	const liveFor = useRef<Address>();

	const { data: blockNumber } = useBlockNumber({ watch, chainId });

	const refetch = useCallback(async (): Promise<PositionLiveState | undefined> => {
		if (!address || !collateral || !version) return undefined;
		try {
			const state = await readPositionLive({ position: address, collateral, version }, chainId);
			liveFor.current = address;
			setLive(state);
			setError(undefined);
			setUpdatedAt(Date.now());
			return state;
		} catch (e) {
			setError(e as Error);
			return undefined;
		}
	}, [address, collateral, version, chainId]);

	// on mount / position change, and on every block while the tab is visible
	useEffect(() => {
		if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
		refetch();
	}, [refetch, blockNumber]);

	// when the tab becomes visible again
	useEffect(() => {
		if (typeof document === "undefined") return;
		const onVisible = () => {
			if (document.visibilityState === "visible") refetch();
		};
		document.addEventListener("visibilitychange", onVisible);
		return () => document.removeEventListener("visibilitychange", onVisible);
	}, [refetch]);

	// never serve a live state that belongs to a previously viewed position
	const liveForThis = live && liveFor.current === address ? live : undefined;

	const position = useMemo(() => {
		if (!indexed) return undefined;
		return liveForThis ? mergePositionLive(indexed, liveForThis) : indexed;
	}, [indexed, liveForThis]);

	return {
		/** indexed record with live fields overlaid; equals the indexed record until the first read completes */
		position,
		live: liveForThis,
		isLive: liveForThis !== undefined,
		error,
		updatedAt,
		refetch,
	};
}
