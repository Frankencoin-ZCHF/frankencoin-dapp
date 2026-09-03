import { useConnection, useReadContracts } from "wagmi";
import { decodeBigIntCall } from "@utils";
import { zeroAddress } from "viem";
import { ADDRESS, EquityABI, FCSABI, FrankencoinABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

export const useFCSStats = () => {
	const { address } = useConnection();
	const account = address || zeroAddress;

	const fcsContract = {
		address: ADDRESS[mainnet.id].fcs,
		chainId: mainnet.id,
		abi: FCSABI,
	};

	const equityContract = {
		address: ADDRESS[mainnet.id].equity,
		chainId: mainnet.id,
		abi: EquityABI,
	};

	const frankenContract = {
		address: ADDRESS[mainnet.id].frankencoin,
		chainId: mainnet.id,
		abi: FrankencoinABI,
	};

	const { data } = useReadContracts({
		contracts: [
			// FCS calls
			{
				...fcsContract,
				functionName: "totalSupply",
			},
			{
				...fcsContract,
				functionName: "totalAssets",
			},
			{
				...fcsContract,
				functionName: "ask",
			},
			{
				...fcsContract,
				functionName: "bid",
			},
			{
				...fcsContract,
				functionName: "isBinding",
			},
			{
				...fcsContract,
				functionName: "balanceOf",
				args: [account],
			},
			{
				...fcsContract,
				functionName: "holdingDuration",
				args: [account],
			},
			{
				...fcsContract,
				functionName: "averageHoldingDuration",
			},
			{
				...fcsContract,
				functionName: "maxRedeem",
				args: [account],
			},
			// FPS1 (equity) calls, from FCS's perspective
			{
				...equityContract,
				functionName: "balanceOf",
				args: [account],
			},
			{
				...equityContract,
				functionName: "allowance",
				args: [account, ADDRESS[mainnet.id].fcs],
			},
			// ZCHF calls, from FCS's perspective
			{
				...frankenContract,
				functionName: "balanceOf",
				args: [account],
			},
			{
				...frankenContract,
				functionName: "allowance",
				args: [account, ADDRESS[mainnet.id].fcs],
			},
		],
	});

	const fcsSupply: bigint = data ? decodeBigIntCall(data[0]) : 0n;
	const fcsTotalAssets: bigint = data ? decodeBigIntCall(data[1]) : 0n;
	const fcsAsk: bigint = data ? decodeBigIntCall(data[2]) : 0n;
	const fcsBid: bigint = data ? decodeBigIntCall(data[3]) : 0n;
	const fcsIsBinding: boolean = data ? Boolean(data[4].result) : false;
	const fcsBalance: bigint = data ? decodeBigIntCall(data[5]) : 0n;
	const fcsHoldingDuration: bigint = data ? decodeBigIntCall(data[6]) : 0n;
	const fcsAverageHoldingDuration: bigint = data ? decodeBigIntCall(data[7]) : 0n;
	const fcsMaxRedeem: bigint = data ? decodeBigIntCall(data[8]) : 0n;
	const fcsCanUnwrap = fcsHoldingDuration >= fcsAverageHoldingDuration;

	const fpsBalance: bigint = data ? decodeBigIntCall(data[9]) : 0n;
	const fpsAllowanceForFcs: bigint = data ? decodeBigIntCall(data[10]) : 0n;

	const frankenBalance: bigint = data ? decodeBigIntCall(data[11]) : 0n;
	const frankenAllowanceForFcs: bigint = data ? decodeBigIntCall(data[12]) : 0n;

	return {
		fcsSupply,
		fcsTotalAssets,
		fcsAsk,
		fcsBid,
		fcsIsBinding,
		fcsBalance,
		fcsHoldingDuration,
		fcsAverageHoldingDuration,
		fcsMaxRedeem,
		fcsCanUnwrap,

		fpsBalance,
		fpsAllowanceForFcs,

		frankenBalance,
		frankenAllowanceForFcs,
	};
};
