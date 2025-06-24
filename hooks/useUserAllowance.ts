import { useAccount, useReadContracts } from "wagmi";
import { decodeBigIntCall } from "@utils";
import { ADDRESS, BridgedFrankencoinABI, ChainId, ChainIdMain, ChainIdSide, FrankencoinABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import { Address, zeroAddress } from "viem";

export type SpenderChain = {
	spender: Address;
	chainId: ChainId;
};

export const useUserAllowance = (spenderChain: SpenderChain[], account?: Address) => {
	const { address } = useAccount();

	if (!account) account = address || zeroAddress;

	// Fetch all blockchain stats in one web3 call using multicall
	const { data, isError, isLoading } = useReadContracts({
		contracts: spenderChain.map((spender) => ({
			address:
				spender.chainId == mainnet.id
					? ADDRESS[spender.chainId as ChainIdMain].frankencoin
					: ADDRESS[spender.chainId as ChainIdSide].ccipBridgedFrankencoin,
			chainId: spender.chainId,
			abi: spender.chainId == mainnet.id ? FrankencoinABI : BridgedFrankencoinABI,
			functionName: "balanceOf",
			args: [account],
		})),
	});

	return spenderChain.map(({ spender, chainId }, idx) => ({
		spender,
		chainId,
		// @ts-ignore
		allowance: data ? decodeBigIntCall(data[idx]) : BigInt(0), // Type instantiation is excessively deep and possibly infinite
	}));
};
