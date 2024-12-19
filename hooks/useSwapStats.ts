import { useAccount, useReadContracts } from "wagmi";
import { decodeBigIntCall } from "@utils";
import { Address, erc20Abi } from "viem";
import { WAGMI_CHAIN } from "../app.config";
import { ADDRESS, StablecoinBridgeABI } from "@deuro/eurocoin";

const getTokenContractBasics = (chainId: number, address: Address, account: Address, bridgeAddress: Address) => {
	return [
		{ // Balance of the user in the wallet
			chainId,
			address,
			abi: erc20Abi,
			functionName: "balanceOf",
			args: [account],
		},
		{ // Symbol of the token
			chainId,
			address,
			abi: erc20Abi,
			functionName: "symbol",
		},
		{ // Allowance of the user to the bridge
			chainId,
			address,
			abi: erc20Abi,
			functionName: "allowance",
			args: [account, bridgeAddress],
		},
		{ // Balance of the bridge
			chainId,
			address,
			abi: erc20Abi,
			functionName: "balanceOf",
			args: [bridgeAddress],
		},
		{ // Decimals of the token
			chainId,
			address,
			abi: erc20Abi,
			functionName: "decimals",
		},
		{ // Limit of the bridge
			chainId,
			address: bridgeAddress,
			abi: StablecoinBridgeABI,
			functionName: "limit",
		},
		{ // Minted coins of the bridge
			chainId,
			address: bridgeAddress,
			abi: StablecoinBridgeABI,
			functionName: "minted",
		},
	];
};

const parseStablecoinStats = (data: any, fromIndex: number) => {
	return {
		userBal: data ? decodeBigIntCall(data[fromIndex]) : BigInt(0),
		symbol: data ? String(data[fromIndex + 1].result) : "",
		userAllowance: data ? decodeBigIntCall(data[fromIndex + 2]) : BigInt(0),
		bridgeBal: data ? decodeBigIntCall(data[fromIndex + 3]) : BigInt(0),
		decimals: data ? decodeBigIntCall(data[fromIndex + 4]) : BigInt(0),
		limit: data ? decodeBigIntCall(data[fromIndex + 5]) : BigInt(0),
		minted: data ? decodeBigIntCall(data[fromIndex + 6]) : BigInt(0),
		remaining: data ? decodeBigIntCall(data[fromIndex + 5]) - decodeBigIntCall(data[fromIndex + 6]) : BigInt(0),
	}
}

export const useSwapStats = () => {
	const chainId = WAGMI_CHAIN.id as number;
	const { address } = useAccount();
	const account = address || "0x0";

	const { data, isError, isLoading } = useReadContracts({
		contracts: [
			// Stablecoin Calls
			...getTokenContractBasics(chainId, ADDRESS[chainId].eurt, account, ADDRESS[chainId].bridgeEURT),
			...getTokenContractBasics(chainId, ADDRESS[chainId].eurc, account, ADDRESS[chainId].bridgeEURC),
			...getTokenContractBasics(chainId, ADDRESS[chainId].veur, account, ADDRESS[chainId].bridgeVEUR),
			...getTokenContractBasics(chainId, ADDRESS[chainId].eurs, account, ADDRESS[chainId].bridgeEURS),

			// dEURO Calls
			{
				chainId,
				address: ADDRESS[chainId].decentralizedEURO,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [account],
			},
			{
				chainId,
				address: ADDRESS[chainId].decentralizedEURO,
				abi: erc20Abi,
				functionName: "symbol",
			},
			{
				chainId,
				address: ADDRESS[chainId].decentralizedEURO,
				abi: erc20Abi,
				functionName: "decimals",
			},
			{
				chainId,
				address: ADDRESS[chainId].decentralizedEURO,
				abi: erc20Abi,
				functionName: "allowance",
				args: [account, ADDRESS[chainId].bridgeEURT],
			},
			{
				chainId,
				address: ADDRESS[chainId].decentralizedEURO,
				abi: erc20Abi,
				functionName: "allowance",
				args: [account, ADDRESS[chainId].bridgeEURC],
			},
			{
				chainId,
				address: ADDRESS[chainId].decentralizedEURO,
				abi: erc20Abi,
				functionName: "allowance",
				args: [account, ADDRESS[chainId].bridgeVEUR],
			},
			{
				chainId,
				address: ADDRESS[chainId].decentralizedEURO,
				abi: erc20Abi,
				functionName: "allowance",
				args: [account, ADDRESS[chainId].bridgeEURS],
			}
		],
	});

	const eurt = {
		...parseStablecoinStats(data, 0),
		contractAddress: ADDRESS[chainId].eurt,
		contractBridgeAddress: ADDRESS[chainId].bridgeEURT,
	};

	const eurc = {
		...parseStablecoinStats(data, 7),
		contractAddress: ADDRESS[chainId].eurc,
		contractBridgeAddress: ADDRESS[chainId].bridgeEURC,
	};

	const veur = {
		...parseStablecoinStats(data, 14),
		contractAddress: ADDRESS[chainId].veur,
		contractBridgeAddress: ADDRESS[chainId].bridgeVEUR,
	};

	const eurs = {
		...parseStablecoinStats(data, 21),
		contractAddress: ADDRESS[chainId].eurs,
		contractBridgeAddress: ADDRESS[chainId].bridgeEURS,
	};

	const dEuro = {
		userBal: data ? decodeBigIntCall(data[28]) : BigInt(0),
		symbol: data ? String(data[29].result) : "",
		decimals: data ? decodeBigIntCall(data[30]) : BigInt(0),
		bridgeAllowance: {
			EURT: data ? decodeBigIntCall(data[31]) : BigInt(0),
			EURC: data ? decodeBigIntCall(data[32]) : BigInt(0),
			VEUR: data ? decodeBigIntCall(data[33]) : BigInt(0),
			EURS: data ? decodeBigIntCall(data[34]) : BigInt(0),
		},
		contractAddress: ADDRESS[chainId].decentralizedEURO,
	};

	return {
		isError,
		isLoading,
		eurt,
		eurc,
		veur,
		eurs,
		dEuro,
	};
};
