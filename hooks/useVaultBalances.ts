import { useConnection, useReadContracts } from "wagmi";
import { decodeBigIntCall } from "@utils";
import { ADDRESS, ChainIdMain } from "@frankencoin/zchf";
import { gnosis, mainnet, optimism } from "viem/chains";
import { Address, erc20Abi, zeroAddress } from "viem";
import { ERC4626ABI } from "../abis/ERC4626";

export type VaultChainId = ChainIdMain | typeof optimism.id | typeof gnosis.id;

export type VaultChainStats = {
	vault: Address;
	balance: bigint; // svZCHF held by the account
	balanceValue: bigint; // svZCHF held, denominated in ZCHF
	totalAssets: bigint; // ZCHF backing the vault
	totalSupply: bigint; // svZCHF in circulation
};

export type VaultBalances = Record<VaultChainId, VaultChainStats>;

const EMPTY: VaultChainStats = { vault: zeroAddress, balance: 0n, balanceValue: 0n, totalAssets: 0n, totalSupply: 0n };

export const useVaultBalances = (account?: Address): { data: VaultBalances; isLoading: boolean } => {
	const { address } = useConnection();
	const owner = account ?? address ?? zeroAddress;

	const mainnetVault = ADDRESS[mainnet.id].svZCHF;
	const optimismVault = ADDRESS[optimism.id].svZCHF;
	const gnosisVault = ADDRESS[gnosis.id].svZCHF;

	const { data, isLoading } = useReadContracts({
		contracts: [
			{ address: mainnetVault, chainId: mainnet.id, abi: erc20Abi, functionName: "balanceOf", args: [owner] },
			{ address: mainnetVault, chainId: mainnet.id, abi: erc20Abi, functionName: "totalSupply" },
			{ address: mainnetVault, chainId: mainnet.id, abi: ERC4626ABI, functionName: "totalAssets" },
			{ address: optimismVault, chainId: optimism.id, abi: erc20Abi, functionName: "balanceOf", args: [owner] },
			{ address: optimismVault, chainId: optimism.id, abi: erc20Abi, functionName: "totalSupply" },
			{ address: optimismVault, chainId: optimism.id, abi: ERC4626ABI, functionName: "totalAssets" },
			{ address: gnosisVault, chainId: gnosis.id, abi: erc20Abi, functionName: "balanceOf", args: [owner] },
			{ address: gnosisVault, chainId: gnosis.id, abi: erc20Abi, functionName: "totalSupply" },
			{ address: gnosisVault, chainId: gnosis.id, abi: ERC4626ABI, functionName: "totalAssets" },
		],
	});

	const build = (vault: Address, balanceIdx: number): VaultChainStats => {
		if (!data) return { ...EMPTY, vault };

		const balance = decodeBigIntCall(data[balanceIdx]);
		const totalSupply = decodeBigIntCall(data[balanceIdx + 1]);
		const totalAssets = decodeBigIntCall(data[balanceIdx + 2]);
		const balanceValue = totalSupply > 0n ? (balance * totalAssets) / totalSupply : balance;

		return { vault, balance, balanceValue, totalAssets, totalSupply };
	};

	return {
		data: {
			[mainnet.id]: build(mainnetVault, 0),
			[optimism.id]: build(optimismVault, 3),
			[gnosis.id]: build(gnosisVault, 6),
		} as VaultBalances,
		isLoading,
	};
};
