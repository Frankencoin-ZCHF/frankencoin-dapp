import { useAccount, useReadContracts } from "wagmi";
import { decodeBigIntCall } from "@utils";
import { erc20Abi } from "viem";
import { ADDRESS, StablecoinBridgeABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

export const useSwapXCHFStats = () => {
	const chainId = mainnet.id;
	const { address } = useAccount();
	const account = address || "0x0";

	const other = ADDRESS[chainId].xchfToken;
	const bridge = ADDRESS[chainId].stablecoinBridgeXCHF;

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

	return {
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
	};
};
