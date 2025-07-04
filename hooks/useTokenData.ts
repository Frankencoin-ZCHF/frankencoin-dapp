import { erc20Abi, getAddress, isAddress, zeroAddress } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { decodeBigIntCall } from "../utils/format";
import { ADDRESS } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

export const useTokenData = (addr: string) => {
	if (!isAddress(addr)) addr = zeroAddress;
	const tokenAddress = getAddress(addr);
	const { address } = useAccount();
	const chainId = mainnet.id;

	const account = address || zeroAddress;
	const mintingHub = ADDRESS[mainnet.id].mintingHubV1;
	const { data } = useReadContracts({
		contracts: [
			{
				address: tokenAddress,
				chainId,
				abi: erc20Abi,
				functionName: "name",
			},
			{
				address: tokenAddress,
				chainId,
				abi: erc20Abi,
				functionName: "symbol",
			},
			{
				address: tokenAddress,
				chainId,
				abi: erc20Abi,
				functionName: "decimals",
			},
			{
				address: tokenAddress,
				chainId,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [account],
			},
			{
				address: tokenAddress,
				chainId,
				abi: erc20Abi,
				functionName: "allowance",
				args: [account, mintingHub],
			},
		],
	});

	const name = data && !data[0].error ? String(data[0].result) : "NaN";
	const symbol = data && !data[1].error ? String(data[1].result) : "NaN";
	const decimals = data ? decodeBigIntCall(data[2]) : BigInt(0);
	const balance = data ? decodeBigIntCall(data[3]) : BigInt(0);
	const allowance = data ? decodeBigIntCall(data[4]) : BigInt(0);

	return {
		address: tokenAddress,
		name,
		symbol,
		decimals,
		balance,
		allowance,
	};
};
