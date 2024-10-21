import { useAccount, useChainId, useReadContracts } from "wagmi";
import { decodeBigIntCall } from "@utils";
import { ADDRESS, EquityABI, FrankencoinABI } from "@frankencoin/zchf";

export const useUserBalance = () => {
	const chainId = useChainId();
	const { address } = useAccount();

	const frankenContract = {
		address: ADDRESS[chainId].frankenCoin,
		abi: FrankencoinABI,
	} as const;

	const equityContract = {
		address: ADDRESS[chainId].equity,
		abi: EquityABI,
	};

	const account = address || "0x0";

	// Fetch all blockchain stats in one web3 call using multicall
	const { data, isError, isLoading } = useReadContracts({
		contracts: [
			// Frankencoin Calls
			{
				...frankenContract,
				functionName: "balanceOf",
				args: [account],
			},
			{
				...equityContract,
				functionName: "balanceOf",
				args: [account],
			},
		],
	});

	const frankenBalance: bigint = data ? decodeBigIntCall(data[0]) : BigInt(0);
	const equityBalance: bigint = data ? decodeBigIntCall(data[1]) : BigInt(0);

	return {
		frankenBalance,
		equityBalance,
	};
};
