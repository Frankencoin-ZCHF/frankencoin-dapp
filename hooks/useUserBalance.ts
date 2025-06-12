import { useAccount, useReadContracts } from "wagmi";
import { decodeBigIntCall } from "@utils";
import { ADDRESS, BridgedFrankencoinABI, ChainId, EquityABI, FrankencoinABI } from "@frankencoin/zchf";
import { arbitrum, avalanche, base, gnosis, mainnet, optimism, polygon, sonic } from "viem/chains";
import { Address, zeroAddress } from "viem";

export type ChainBalance = {
	frankencoin: bigint;
	equity?: bigint; // optional if not all chains return equity
};

export type UserBalance = Record<ChainId, ChainBalance>;

export const useUserBalance = (account?: Address): UserBalance => {
	const { address } = useAccount();

	if (!account) account = address || zeroAddress;

	// Fetch all blockchain stats in one web3 call using multicall
	const { data, isError, isLoading } = useReadContracts({
		contracts: [
			// mainnet calls
			{
				address: ADDRESS[mainnet.id].frankencoin,
				chainId: mainnet.id,
				abi: FrankencoinABI,
				functionName: "balanceOf",
				args: [account],
			},
			{
				address: ADDRESS[mainnet.id].equity,
				chainId: mainnet.id,
				abi: EquityABI,
				functionName: "balanceOf",
				args: [account],
			},
			// side chain calls
			{
				address: ADDRESS[polygon.id].ccipBridgedFrankencoin,
				chainId: polygon.id,
				abi: BridgedFrankencoinABI,
				functionName: "balanceOf",
				args: [account],
			},
			{
				address: ADDRESS[arbitrum.id].ccipBridgedFrankencoin,
				chainId: arbitrum.id,
				abi: BridgedFrankencoinABI,
				functionName: "balanceOf",
				args: [account],
			},
			{
				address: ADDRESS[optimism.id].ccipBridgedFrankencoin,
				chainId: optimism.id,
				abi: BridgedFrankencoinABI,
				functionName: "balanceOf",
				args: [account],
			},
			{
				address: ADDRESS[base.id].ccipBridgedFrankencoin,
				chainId: base.id,
				abi: BridgedFrankencoinABI,
				functionName: "balanceOf",
				args: [account],
			},
			{
				address: ADDRESS[avalanche.id].ccipBridgedFrankencoin,
				chainId: avalanche.id,
				abi: BridgedFrankencoinABI,
				functionName: "balanceOf",
				args: [account],
			},
			{
				address: ADDRESS[gnosis.id].ccipBridgedFrankencoin,
				chainId: gnosis.id,
				abi: BridgedFrankencoinABI,
				functionName: "balanceOf",
				args: [account],
			},
			{
				address: ADDRESS[sonic.id].ccipBridgedFrankencoin,
				chainId: sonic.id,
				abi: BridgedFrankencoinABI,
				functionName: "balanceOf",
				args: [account],
			},
		],
	});

	return {
		[mainnet.id]: {
			frankencoin: data ? decodeBigIntCall(data[0]) : BigInt(0),
			equity: data ? decodeBigIntCall(data[1]) : BigInt(0),
		},
		[polygon.id]: {
			frankencoin: data ? decodeBigIntCall(data[2]) : BigInt(0),
		},
		[arbitrum.id]: {
			frankencoin: data ? decodeBigIntCall(data[3]) : BigInt(0),
		},
		[optimism.id]: {
			frankencoin: data ? decodeBigIntCall(data[4]) : BigInt(0),
		},
		[base.id]: {
			frankencoin: data ? decodeBigIntCall(data[5]) : BigInt(0),
		},
		[avalanche.id]: {
			frankencoin: data ? decodeBigIntCall(data[6]) : BigInt(0),
		},
		[gnosis.id]: {
			frankencoin: data ? decodeBigIntCall(data[7]) : BigInt(0),
		},
		[sonic.id]: {
			frankencoin: data ? decodeBigIntCall(data[8]) : BigInt(0),
		},
	};
};
