import { erc20Abi, getAddress, isAddress, zeroAddress } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { decodeBigIntCall } from "../utils/format";
import { WAGMI_CHAIN } from "../app.config";
import { ADDRESS } from "@deuro/eurocoin";

export const useTokenData = (addr: string) => {
	if (!isAddress(addr)) addr = zeroAddress;
	const tokenAddress = getAddress(addr);
	const { address } = useAccount();

	const account = address || zeroAddress;
	const mintingHub = ADDRESS[WAGMI_CHAIN.id].mintingHubGateway;
	const { data, refetch } = useReadContracts({
		contracts: [
			{
				address: tokenAddress,
				abi: erc20Abi,
				functionName: "name",
			},
			{
				address: tokenAddress,
				abi: erc20Abi,
				functionName: "symbol",
			},
			{
				address: tokenAddress,
				abi: erc20Abi,
				functionName: "decimals",
			},
			{
				address: tokenAddress,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [account],
			},
			{
				address: tokenAddress,
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
		refetch,
	};
};
