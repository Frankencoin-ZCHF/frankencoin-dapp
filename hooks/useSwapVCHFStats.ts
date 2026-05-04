import { useConnection, useReadContracts } from "wagmi";
import { decodeBigIntCall, normalizeAddress } from "@utils";
import { Address, erc20Abi, formatUnits, zeroAddress } from "viem";
import { ADDRESS, StablecoinBridgeABI } from "@frankencoin/zchf";
import { mainnet, type Chain } from "viem/chains";
import { useSelector } from "react-redux";
import { RootState } from "../redux/redux.store";
import { PositionQuery, PositionQueryV2, PriceQuery } from "@frankencoin/api";

export type CollateralOverviewStat = {
	original: PositionQuery;
	originals: PositionQuery[];
	clones: PositionQuery[];
	balance: bigint;
	collateral: PriceQuery;
	mint: PriceQuery;
	minted: bigint;
	reserve: bigint;
	limitForClones: bigint;
	availableForClones: bigint;
	totalValue: number;
	avgCollateral: number;
	highestZCHFPrice: number;
	collateralizedPct: number;
	availableForClonesPct: number;
	collateralPriceInZCHF: number;
	worstStatusColors: string;
	lowestInterestRate: number;
	discussionLink: string;
	lockedValue: number;
};

export type SwapVCHFStatsReturn = {
	// chain
	chain: Chain;
	chainId: number;
	// contract addresses
	otherAddress: Address;
	bridgeAddress: Address;
	frankencoinAddress: Address;
	// stablecoin metadata
	otherLabel: string;
	otherInfoUrl: string;
	// balances & allowances
	isError: boolean;
	isLoading: boolean;
	otherUserBal: bigint;
	otherSymbol: string;
	otherUserAllowance: bigint;
	otherBridgeBal: bigint;
	zchfUserBal: bigint;
	zchfSymbol: string;
	zchfUserAllowance: bigint;
	bridgeLimit: bigint;
	bridgeHorizon: bigint;
	// rich objects
	asBorrowPosition: PositionQueryV2;
	asCollateralOverview: CollateralOverviewStat;
};

export const useSwapVCHFStats = (): SwapVCHFStatsReturn => {
	const chainId = mainnet.id;
	const { address } = useConnection();
	const account = address || "0x0";
	const { coingecko } = useSelector((state: RootState) => state.prices);

	const other = ADDRESS[chainId].vchfToken;
	const bridge = ADDRESS[chainId].stablecoinBridgeVCHF;

	const { data, isError, isLoading } = useReadContracts({
		contracts: [
			// Other Calls
			{
				chainId,
				address: other,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [account],
			},
			{
				chainId,
				address: other,
				abi: erc20Abi,
				functionName: "symbol",
			},
			{
				chainId,
				address: other,
				abi: erc20Abi,
				functionName: "allowance",
				args: [account, bridge],
			},
			{
				chainId,
				address: other,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [bridge],
			},
			// Frankencoin Calls
			{
				chainId,
				address: ADDRESS[chainId].frankencoin,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [account],
			},
			{
				chainId,
				address: ADDRESS[chainId].frankencoin,
				abi: erc20Abi,
				functionName: "symbol",
			},
			{
				chainId,
				address: ADDRESS[chainId].frankencoin,
				abi: erc20Abi,
				functionName: "allowance",
				args: [account, bridge],
			},
			// Bridge Calls
			{
				chainId,
				address: bridge,
				abi: StablecoinBridgeABI,
				functionName: "limit",
			},
			{
				chainId,
				address: bridge,
				abi: StablecoinBridgeABI,
				functionName: "horizon",
			},
		],
	});

	const otherUserBal: bigint = data ? decodeBigIntCall(data[0]) : BigInt(0);
	const otherSymbol: string = data ? String(data[1].result) : "";
	const otherUserAllowance: bigint = data ? decodeBigIntCall(data[2]) : BigInt(0);
	const otherBridgeBal: bigint = data ? decodeBigIntCall(data[3]) : BigInt(0);

	const zchfUserBal: bigint = data ? decodeBigIntCall(data[4]) : BigInt(0);
	const zchfSymbol: string = data ? String(data[5].result) : "";
	const zchfUserAllowance: bigint = data ? decodeBigIntCall(data[6]) : BigInt(0);

	const bridgeLimit: bigint = data ? decodeBigIntCall(data[7]) : BigInt(0);
	const bridgeHorizon: bigint = data ? decodeBigIntCall(data[8]) : BigInt(0);

	const vchfAddress: Address = normalizeAddress(other);
	const vchfPrice = coingecko[vchfAddress]?.price?.chf ?? 0;
	const available = bridgeLimit - otherBridgeBal;

	const asBorrowPosition: PositionQueryV2 = {
		version: 2,
		position: bridge as Address,
		owner: zeroAddress,
		zchf: ADDRESS[chainId].frankencoin as Address,
		collateral: vchfAddress,
		price: String(1 * 10 ** 18),
		created: 0,
		isOriginal: true,
		isClone: false,
		denied: false,
		denyDate: 0,
		closed: false,
		original: bridge as Address,
		parent: bridge as Address,
		minimumCollateral: "0",
		annualInterestPPM: 0,
		riskPremiumPPM: 0,
		reserveContribution: 0,
		start: 0,
		cooldown: 0,
		expiration: Number(bridgeHorizon),
		challengePeriod: 0,
		zchfName: "Frankencoin",
		zchfSymbol: "ZCHF",
		zchfDecimals: 18,
		collateralName: "VNX Franc",
		collateralSymbol: "VCHF",
		collateralDecimals: 18,
		collateralBalance: String(otherBridgeBal),
		limitForPosition: "0",
		limitForClones: String(bridgeLimit),
		availableForClones: String(available),
		availableForMinting: String(available),
		availableForPosition: String(available),
		minted: String(otherBridgeBal),
	};

	const vchfCollateral: PriceQuery = coingecko[vchfAddress] || {
		chainId,
		address: vchfAddress,
		name: "VNX Franc",
		symbol: "VCHF",
		decimals: 18,
		price: { chf: vchfPrice },
		timestamp: 0,
	};
	const zchfAddress = ADDRESS[chainId].frankencoin as Address;
	const zchfMint: PriceQuery = coingecko[normalizeAddress(zchfAddress)] || {
		chainId,
		address: zchfAddress,
		name: "Frankencoin",
		symbol: "ZCHF",
		decimals: 18,
		price: { chf: 1 },
		timestamp: 0,
	};
	const totalValue = Math.round(Number(formatUnits(otherBridgeBal, 18)) * vchfPrice);

	const asCollateralOverview: CollateralOverviewStat = {
		original: { position: bridge } as PositionQuery,
		originals: [],
		clones: [],
		balance: otherBridgeBal,
		collateral: vchfCollateral,
		mint: zchfMint,
		minted: otherBridgeBal,
		reserve: 0n,
		limitForClones: bridgeLimit / 10n ** 18n,
		availableForClones: available / 10n ** 18n,
		totalValue,
		avgCollateral: vchfPrice,
		highestZCHFPrice: vchfPrice,
		collateralizedPct: vchfPrice * 100,
		availableForClonesPct: bridgeLimit > 0n ? Math.round((Number(available) / Number(bridgeLimit)) * 10000) / 100 : 0,
		collateralPriceInZCHF: vchfPrice,
		worstStatusColors: "green-300",
		lowestInterestRate: 0,
		discussionLink: "",
		lockedValue: Number(formatUnits(otherBridgeBal, 18)) * vchfPrice,
	};

	return {
		chain: mainnet,
		chainId,
		otherAddress: vchfAddress,
		bridgeAddress: bridge as Address,
		frankencoinAddress: zchfAddress,
		otherLabel: "VNX Swiss Franc (VCHF)",
		otherInfoUrl: "https://vnx.li/vchf/",

		isError,
		isLoading,

		otherUserBal,
		otherSymbol,
		otherUserAllowance,
		otherBridgeBal,

		zchfUserBal,
		zchfSymbol,
		zchfUserAllowance,

		bridgeLimit,
		bridgeHorizon,
		asBorrowPosition,
		asCollateralOverview,
	};
};
