import { useAccount, useChainId, useReadContracts } from "wagmi";
import { erc20Abi } from "viem";
import { ADDRESS } from "@contracts";
import { ABIS } from "@contracts";
import { decodeBigIntCall } from "@utils";

export const useHomeStats = () => {
	const chainId = useChainId();
	const { address } = useAccount();

	const frankenContract = {
		address: ADDRESS[chainId].frankenCoin,
		abi: ABIS.FrankencoinABI,
	} as const;

	const xchfContract = {
		address: ADDRESS[chainId].xchf,
		abi: erc20Abi,
	};

	const equityContract = {
		address: ADDRESS[chainId].equity,
		abi: ABIS.EquityABI,
	};

	const account = address || "0x0";

	// Fetch all blockchain stats in one web3 call using multicall
	const { data, isError, isLoading } = useReadContracts({
		contracts: [
			// Frankencoin Calls
			{
				...frankenContract,
				functionName: "totalSupply",
			},
			{
				...frankenContract,
				functionName: "symbol",
			},
			{
				...frankenContract,
				functionName: "balanceOf",
				args: [account],
			},
			{
				...frankenContract,
				functionName: "equity",
			},
			{
				...frankenContract,
				functionName: "minterReserve",
			},
			// XCHF Calls
			{
				...xchfContract,
				functionName: "balanceOf",
				args: [account],
			},
			{
				...xchfContract,
				functionName: "balanceOf",
				args: [ADDRESS[chainId].bridge],
			},
			{
				...xchfContract,
				functionName: "symbol",
			},
			// Equity Calls
			{
				...equityContract,
				functionName: "price",
			},
			{
				...equityContract,
				functionName: "totalSupply",
			},
			{
				...equityContract,
				functionName: "balanceOf",
				args: [account],
			},
			{
				...equityContract,
				functionName: "totalVotes",
			},
			{
				...equityContract,
				functionName: "votes",
				args: [account],
			},
		],
	});

	const frankenTotalSupply: bigint = data ? decodeBigIntCall(data[0]) : BigInt(0);
	const frankenSymbol: string = data ? String(data[1].result) : "";
	const frankenBalance: bigint = data ? decodeBigIntCall(data[2]) : BigInt(0);
	const frankenEquity: bigint = data ? decodeBigIntCall(data[3]) : BigInt(0);
	const frankenMinterReserve: bigint = data ? decodeBigIntCall(data[4]) : BigInt(0);

	const xchfUserBal: bigint = data ? decodeBigIntCall(data[5]) : BigInt(0);
	const xchfBridgeBal: bigint = data ? decodeBigIntCall(data[6]) : BigInt(0);
	const xchfSymbol: string = data ? String(data[7].result) : "";

	const equityPrice: bigint = data ? decodeBigIntCall(data[8]) : BigInt(0);
	const equityTotalSupply: bigint = data ? decodeBigIntCall(data[9]) : BigInt(0);
	const equityMarketCap: bigint = (equityPrice * equityTotalSupply) / BigInt(1e18);
	const equityBalance: bigint = data ? decodeBigIntCall(data[10]) : BigInt(0);
	const equityTotalVotes: bigint = data ? decodeBigIntCall(data[11]) : BigInt(0);
	const equityUserVotes: bigint = data ? decodeBigIntCall(data[12]) : BigInt(0);

	return {
		frankenTotalSupply,
		frankenSymbol,
		frankenBalance,
		frankenEquity,
		frankenMinterReserve,

		xchfUserBal,
		xchfBridgeBal,
		xchfSymbol,

		equityPrice,
		equityTotalSupply,
		equityMarketCap,
		equityBalance,
		equityTotalVotes,
		equityUserVotes,
	};
};
