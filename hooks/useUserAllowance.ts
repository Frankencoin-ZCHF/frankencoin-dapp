import { useAccount, useReadContracts } from "wagmi";
import { decodeBigIntCall } from "@utils";
import { ADDRESS, BridgedFrankencoinABI, FrankencoinABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import { Address, Chain, zeroAddress } from "viem";

export type SpenderChain = {
	spender: Address;
	chainId: Chain["id"] | number;
};

export const useUserAllowance = (spenderChain: SpenderChain[], account?: Address) => {
	const { address } = useAccount();

	if (!account) account = address || zeroAddress;

	// Fetch all blockchain stats in one web3 call using multicall
	const { data, isError, isLoading } = useReadContracts({
		contracts: spenderChain.map((spender) => ({
			// @ts-ignore
			address: spender.chainId == mainnet.id ? ADDRESS[mainnet.id].frankencoin : ADDRESS[spender.chainId].ccipBridgedFrankencoin,
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
