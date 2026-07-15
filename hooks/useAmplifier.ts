import { useEffect } from "react";
import { useBlockNumber, useConnection, useReadContracts } from "wagmi";
import { Address, erc20Abi, zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { FrankencoinABI, UniswapV3PoolABI } from "@frankencoin/zchf";
import { decodeBigIntCall } from "@utils";
import { FrankencoinTestMinterABI, UniswapAmplifierABI } from "../abis/UniswapAmplifier";
import { priceX96ToRawPrice, rawPriceToTick, tickToRawPrice } from "../utils/uniswapV3Math";

export type AmplifierStats = {
	chainId: number;
	address: Address | undefined;
	isLoading: boolean;
	invalid: boolean;

	// immutable config
	pool: Address;
	zchf: Address;
	usd: Address;
	minter: Address;
	zchfIsToken0: boolean;
	minimumTick: number; // lower bound of the allowed position ticks
	maximumTick: number; // upper bound of the allowed position ticks
	priceAnchorX96: bigint;
	anchorPrice: number; // the anchor price in human "USD per ZCHF" terms
	expiration: bigint;
	limit: bigint;
	tickSpacing: number;
	usdSymbol: string;
	usdDecimals: number;
	zchfSymbol: string;

	// live state
	totalBorrowed: bigint;
	priceX96: bigint; // token1 per token0, Q96 (matches getPrice() and the expectedPriceX96 params)
	sqrtPriceX96: bigint;
	currentTick: number;
	usdUserBalance: bigint;
	usdUserAllowance: bigint; // allowance of the user's USD towards the amplifier
	zchfUserBalance: bigint;
	minterIsRegistered: boolean; // registered Frankencoin minters can burnFrom without an allowance
	zchfMinterAllowance: bigint; // allowance of the user's ZCHF towards the minter (needed for unregistered ones)
	zchfAmplifierAllowance: bigint; // allowance of the user's ZCHF towards the amplifier, which moves borrowed ZCHF into the pool
	minterDeposit: bigint | undefined; // the user's ZCHF deposit at a FrankencoinTestMinter, undefined for regular minters

	// price conversion between ticks / raw pool prices and human "USD per ZCHF"
	usdPerZchfAtTick: (tick: number) => number;
	tickAtUsdPerZchf: (usdPerZchf: number) => number;
	usdPerZchf: number; // current pool price in human terms

	// reciprocal orientation ("ZCHF per USD"), which is what the UI displays
	zchfPerUsdAtTick: (tick: number) => number;
	tickAtZchfPerUsd: (zchfPerUsd: number) => number;
	pricePerUsd: number; // current pool price as ZCHF per USD
	anchorPricePerUsd: number; // anchor price as ZCHF per USD
};

// One price orientation of an amplifier, bundling everything the UI needs to display
// prices consistently: the unit label, the live prices, and the tick conversions.
// Direction-sensitive wording must branch on `inverted`: in the default orientation
// (ZCHF per USD) a strengthening dollar means a RISING price, in the inverted one
// (USD per ZCHF) a FALLING price.
export type AmplifierPriceView = {
	inverted: boolean; // false: ZCHF per USD (e.g. 0.81), true: USD per ZCHF (e.g. 1.23)
	unit: string;
	current: number;
	anchor: number;
	atTick: (tick: number) => number;
	tickAt: (price: number) => number;
};

export const getPriceView = (stats: AmplifierStats, inverted: boolean): AmplifierPriceView => {
	const zchf = stats.zchfSymbol || "ZCHF";
	const usd = stats.usdSymbol || "USD";
	return inverted
		? {
				inverted,
				unit: `${usd}/${zchf}`,
				current: stats.usdPerZchf,
				anchor: stats.anchorPrice,
				atTick: stats.usdPerZchfAtTick,
				tickAt: stats.tickAtUsdPerZchf,
		  }
		: {
				inverted,
				unit: `${zchf}/${usd}`,
				current: stats.pricePerUsd,
				anchor: stats.anchorPricePerUsd,
				atTick: stats.zchfPerUsdAtTick,
				tickAt: stats.tickAtZchfPerUsd,
		  };
};

/**
 * Loads the configuration and live state of a deployed UniswapAmplifier contract,
 * including the connected user's balances and allowances for the involved tokens.
 */
export const useAmplifier = (amplifier: Address | undefined): AmplifierStats => {
	const chainId = mainnet.id;
	const { address } = useConnection();
	const account = address || zeroAddress;

	const { data: configData, isLoading: configLoading } = useReadContracts({
		contracts: [
			{ chainId, address: amplifier, abi: UniswapAmplifierABI, functionName: "UNISWAP_POOL" },
			{ chainId, address: amplifier, abi: UniswapAmplifierABI, functionName: "ZCHF_IS_TOKEN0" },
			{ chainId, address: amplifier, abi: UniswapAmplifierABI, functionName: "ZCHF" },
			{ chainId, address: amplifier, abi: UniswapAmplifierABI, functionName: "USD" },
			{ chainId, address: amplifier, abi: UniswapAmplifierABI, functionName: "MINIMUM_TICK" },
			{ chainId, address: amplifier, abi: UniswapAmplifierABI, functionName: "MAXIMUM_TICK" },
			{ chainId, address: amplifier, abi: UniswapAmplifierABI, functionName: "PRICE_ANCHOR_X96" },
			{ chainId, address: amplifier, abi: UniswapAmplifierABI, functionName: "EXPIRATION" },
			{ chainId, address: amplifier, abi: UniswapAmplifierABI, functionName: "LIMIT" },
			{ chainId, address: amplifier, abi: UniswapAmplifierABI, functionName: "ZCHF_MINTER" },
		],
		query: { enabled: !!amplifier },
	});

	const invalid = !!configData && configData.some((d) => d.status === "failure");
	const pool = (configData?.[0]?.result as Address) || zeroAddress;
	const zchfIsToken0 = configData ? Boolean(configData[1]?.result) : false;
	const zchf = (configData?.[2]?.result as Address) || zeroAddress;
	const usd = (configData?.[3]?.result as Address) || zeroAddress;
	const minimumTick = configData ? Number(configData[4]?.result ?? 0) : 0;
	const maximumTick = configData ? Number(configData[5]?.result ?? 0) : 0;
	const priceAnchorX96 = configData ? decodeBigIntCall(configData[6]) : 0n;
	const expiration = configData ? decodeBigIntCall(configData[7]) : 0n;
	const limit = configData ? decodeBigIntCall(configData[8]) : 0n;
	const minter = (configData?.[9]?.result as Address) || zeroAddress;
	const loaded = !!configData && !invalid && pool !== zeroAddress;

	const { data: blockNumber } = useBlockNumber({ watch: true });
	const {
		data: liveData,
		refetch,
		isLoading: liveLoading,
	} = useReadContracts({
		contracts: [
			{ chainId, address: pool, abi: UniswapV3PoolABI, functionName: "tickSpacing" },
			{ chainId, address: usd, abi: erc20Abi, functionName: "symbol" },
			{ chainId, address: usd, abi: erc20Abi, functionName: "decimals" },
			{ chainId, address: zchf, abi: erc20Abi, functionName: "symbol" },
			{ chainId, address: amplifier, abi: UniswapAmplifierABI, functionName: "totalBorrowed" },
			{ chainId, address: pool, abi: UniswapV3PoolABI, functionName: "slot0" },
			{ chainId, address: usd, abi: erc20Abi, functionName: "balanceOf", args: [account] },
			{ chainId, address: usd, abi: erc20Abi, functionName: "allowance", args: [account, amplifier || zeroAddress] },
			{ chainId, address: zchf, abi: erc20Abi, functionName: "balanceOf", args: [account] },
			{ chainId, address: zchf, abi: FrankencoinABI, functionName: "isMinter", args: [minter] },
			{ chainId, address: zchf, abi: erc20Abi, functionName: "allowance", args: [account, minter] },
			{ chainId, address: zchf, abi: erc20Abi, functionName: "allowance", args: [account, amplifier || zeroAddress] },
			{ chainId, address: minter, abi: FrankencoinTestMinterABI, functionName: "deposits", args: [account] },
		],
		query: { enabled: loaded },
	});

	useEffect(() => {
		if (loaded) refetch();
	}, [blockNumber, loaded, refetch]);

	const tickSpacing = liveData ? Number(liveData[0]?.result ?? 0) : 0;
	const usdSymbol = liveData?.[1]?.result ? String(liveData[1].result) : "";
	const usdDecimals = liveData ? Number(liveData[2]?.result ?? 0) : 0;
	const zchfSymbol = liveData?.[3]?.result ? String(liveData[3].result) : "ZCHF";
	const totalBorrowed = liveData ? decodeBigIntCall(liveData[4]) : 0n;
	const slot0 = liveData?.[5]?.result as readonly [bigint, number, number, number, number, number, boolean] | undefined;
	const sqrtPriceX96 = slot0 ? BigInt(slot0[0]) : 0n;
	const currentTick = slot0 ? Number(slot0[1]) : 0;
	const priceX96 = sqrtPriceX96 > 0n ? (sqrtPriceX96 * sqrtPriceX96) / 2n ** 96n : 0n;
	const usdUserBalance = liveData ? decodeBigIntCall(liveData[6]) : 0n;
	const usdUserAllowance = liveData ? decodeBigIntCall(liveData[7]) : 0n;
	const zchfUserBalance = liveData ? decodeBigIntCall(liveData[8]) : 0n;
	// if the isMinter probe fails (e.g. non-standard token), assume a registered minter, which needs no allowance
	const minterIsRegistered = liveData?.[9]?.status === "success" ? Boolean(liveData[9].result) : true;
	const zchfMinterAllowance = liveData ? decodeBigIntCall(liveData[10]) : 0n;
	const zchfAmplifierAllowance = liveData ? decodeBigIntCall(liveData[11]) : 0n;
	// only FrankencoinTestMinters have a deposits function; the read fails on regular minters
	const minterDeposit = liveData?.[12]?.status === "success" ? decodeBigIntCall(liveData[12]) : undefined;

	// raw pool prices are token1 per token0 in native token units; convert via the decimal
	// difference and invert if ZCHF is token1 to obtain a human "USD per ZCHF" price
	const decimalFactor = Math.pow(10, (zchfIsToken0 ? 18 : usdDecimals) - (zchfIsToken0 ? usdDecimals : 18));
	const usdPerZchfAtTick = (tick: number): number => {
		const human = tickToRawPrice(tick) * decimalFactor;
		return zchfIsToken0 ? human : 1 / human;
	};
	const tickAtUsdPerZchf = (usdPerZchf: number): number => {
		const human = zchfIsToken0 ? usdPerZchf : 1 / usdPerZchf;
		return rawPriceToTick(human / decimalFactor);
	};
	const humanCurrent = priceX96ToRawPrice(priceX96) * decimalFactor;
	const usdPerZchf = priceX96 > 0n ? (zchfIsToken0 ? humanCurrent : 1 / humanCurrent) : 0;

	// PRICE_ANCHOR_X96 is always USD per ZCHF in native token units (the contract inverts it when
	// ZCHF is token1), so converting to human terms only needs the ZCHF/USD decimal adjustment
	const anchorPrice = priceAnchorX96 > 0n ? priceX96ToRawPrice(priceAnchorX96) * Math.pow(10, 18 - usdDecimals) : 0;

	// reciprocal orientation, used for display
	const zchfPerUsdAtTick = (tick: number): number => {
		const u = usdPerZchfAtTick(tick);
		return u > 0 ? 1 / u : 0;
	};
	const tickAtZchfPerUsd = (zchfPerUsd: number): number => tickAtUsdPerZchf(zchfPerUsd > 0 ? 1 / zchfPerUsd : 0);
	const pricePerUsd = usdPerZchf > 0 ? 1 / usdPerZchf : 0;
	const anchorPricePerUsd = anchorPrice > 0 ? 1 / anchorPrice : 0;

	return {
		chainId,
		address: amplifier,
		isLoading: configLoading || (loaded && liveLoading),
		invalid,

		pool,
		zchf,
		usd,
		minter,
		zchfIsToken0,
		minimumTick,
		maximumTick,
		priceAnchorX96,
		anchorPrice,
		expiration,
		limit,
		tickSpacing,
		usdSymbol,
		usdDecimals,
		zchfSymbol,

		totalBorrowed,
		priceX96,
		sqrtPriceX96,
		currentTick,
		usdUserBalance,
		usdUserAllowance,
		zchfUserBalance,
		minterIsRegistered,
		zchfMinterAllowance,
		zchfAmplifierAllowance,
		minterDeposit,

		usdPerZchfAtTick,
		tickAtUsdPerZchf,
		usdPerZchf,

		zchfPerUsdAtTick,
		tickAtZchfPerUsd,
		pricePerUsd,
		anchorPricePerUsd,
	};
};
