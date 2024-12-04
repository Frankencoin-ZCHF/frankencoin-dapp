import { useAccount, useReadContracts } from "wagmi";
import { decodeBigIntCall } from "@utils";
import { erc20Abi } from "viem";
import { WAGMI_CHAIN } from "../app.config";
import { ADDRESS, StablecoinBridgeABI } from "@frankencoin/zchf";

export const useSwapStats = () => {
	const chainId = WAGMI_CHAIN.id as number;
	const { address } = useAccount();
	const account = address || "0x0";

	const { data, isError, isLoading } = useReadContracts({
		contracts: [
			// XCHF Calls
			{
				chainId,
				address: ADDRESS[chainId].xchf,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [account],
			},
			{
				chainId,
				address: ADDRESS[chainId].xchf,
				abi: erc20Abi,
				functionName: "symbol",
			},
			{
				chainId,
				address: ADDRESS[chainId].xchf,
				abi: erc20Abi,
				functionName: "allowance",
				args: [account, ADDRESS[chainId].bridge],
			},
			{
				chainId,
				address: ADDRESS[chainId].xchf,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [ADDRESS[chainId].bridge],
			},
			// Frankencoin Calls
			{
				chainId,
				address: ADDRESS[chainId].frankenCoin,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [account],
			},
			{
				chainId,
				address: ADDRESS[chainId].frankenCoin,
				abi: erc20Abi,
				functionName: "symbol",
			},
			{
				chainId,
				address: ADDRESS[chainId].frankenCoin,
				abi: erc20Abi,
				functionName: "allowance",
				args: [account, ADDRESS[chainId].bridge],
			},
			// Bridge Calls
			{
				chainId,
				address: ADDRESS[chainId].bridge,
				abi: StablecoinBridgeABI,
				functionName: "limit",
			},
		],
	});

	const xchfUserBal: bigint = data ? decodeBigIntCall(data[0]) : BigInt(0);
	const xchfSymbol: string = data ? String(data[1].result) : "";
	const xchfUserAllowance: bigint = data ? decodeBigIntCall(data[2]) : BigInt(0);
	const xchfBridgeBal: bigint = data ? decodeBigIntCall(data[3]) : BigInt(0);

	const zchfUserBal: bigint = data ? decodeBigIntCall(data[4]) : BigInt(0);
	const frankenSymbol: string = data ? String(data[5].result) : "";
	const zchfUserAllowance: bigint = data ? decodeBigIntCall(data[6]) : BigInt(0);

	const bridgeLimit: bigint = data ? decodeBigIntCall(data[7]) : BigInt(0);

	return {
		isError,
		isLoading,

		xchfUserBal,
		xchfSymbol,
		xchfUserAllowance,
		xchfBridgeBal,

		zchfUserBal,
		frankenSymbol,
		zchfUserAllowance,

		bridgeLimit,
	};
};
