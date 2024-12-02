import { useAccount, useChainId, useReadContracts } from "wagmi";
import { decodeBigIntCall } from "@utils";
import { zeroAddress } from "viem";
import { ADDRESS, EquityABI, DecentralizedEUROABI } from "@deuro/eurocoin";

export const usePoolStats = () => {
	const chainId = useChainId();
	const { address } = useAccount();
	const account = address || zeroAddress;

	const equityContract = {
		address: ADDRESS[chainId].equity,
		abi: EquityABI,
	};

	const frankenContract = {
		address: ADDRESS[chainId].decentralizedEURO,
		abi: DecentralizedEUROABI,
	};

	const { data } = useReadContracts({
		contracts: [
			// Equity Calls
			{
				...equityContract,
				functionName: "totalSupply",
			},
			{
				...equityContract,
				functionName: "price",
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
			{
				...equityContract,
				functionName: "canRedeem",
				args: [account],
			},
			{
				...equityContract,
				functionName: "holdingDuration",
				args: [account],
			},
			// Frankencoin Calls
			{
				...frankenContract,
				functionName: "minterReserve",
			},
			{
				...frankenContract,
				functionName: "equity",
			},
			{
				...frankenContract,
				functionName: "balanceOf",
				args: [account],
			},
			{
				...frankenContract,
				functionName: "allowance",
				args: [account, ADDRESS[chainId].equity],
			},
		],
	});

	const equitySupply: bigint = data ? decodeBigIntCall(data[0]) : 0n;
	const equityPrice: bigint = data ? decodeBigIntCall(data[1]) : 0n;
	const equityBalance: bigint = data ? decodeBigIntCall(data[2]) : 0n;
	const equityTotalVotes: bigint = data ? decodeBigIntCall(data[3]) : 0n;
	const equityUserVotes: bigint = data ? decodeBigIntCall(data[4]) : 0n;
	const equityCanRedeem: boolean = data ? Boolean(data[5].result) : false;
	const equityHoldingDuration: bigint = data ? decodeBigIntCall(data[6]) : 0n;

	const frankenMinterReserve: bigint = data ? decodeBigIntCall(data[7]) : 0n;
	const frankenEquity: bigint = data ? decodeBigIntCall(data[8]) : 0n;
	const frankenTotalReserve = frankenMinterReserve + frankenEquity;
	const frankenBalance: bigint = data ? decodeBigIntCall(data[9]) : 0n;
	const frankenAllowance: bigint = data ? decodeBigIntCall(data[10]) : 0n;

	return {
		equitySupply,
		equityPrice,
		equityBalance,
		equityTotalVotes,
		equityUserVotes,
		equityCanRedeem,
		equityHoldingDuration,

		frankenTotalReserve,
		frankenMinterReserve,
		frankenEquity,
		frankenBalance,
		frankenAllowance,
	};
};
