import { useReadContracts } from "wagmi";
import { Address, erc20Abi, zeroAddress } from "viem";
import { ADDRESS, ChainId, ChainIdMain, ChainIdSide, SavingsABI, SupportedChain } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import { WAGMI_CHAINS } from "../app.config";
import { decodeBigIntCall } from "@utils";

export type SavingsChainAccount = {
	chain: SupportedChain;
	module: Address;
	frankencoin: Address;
	walletBalance: bigint; // ZCHF in the wallet on this chain
	saved: bigint; // principal stored in the module
	ticks: bigint;
	ratePPM: bigint;
	referrer: Address;
	referralFeePPM: bigint;
	interest: bigint; // gross accrued interest, not yet collected
	referralFee: bigint; // part of the accrued interest that goes to the referrer
	netInterest: bigint; // part of the accrued interest that goes to the saver
	withdrawable: bigint; // saved + netInterest, what adjust(0) pays out right now
	lockedSeconds: bigint; // seconds until interest starts to accrue
	yearlyInterest: bigint; // net interest earned per year at the current rate, used to extrapolate between reads
};

export const getSavingsModule = (chainId: ChainId): Address =>
	chainId == mainnet.id ? ADDRESS[chainId as ChainIdMain].savingsReferral : ADDRESS[chainId as ChainIdSide].ccipBridgedSavings;

export const getFrankencoin = (chainId: ChainId): Address =>
	chainId == mainnet.id ? ADDRESS[chainId as ChainIdMain].frankencoin : ADDRESS[chainId as ChainIdSide].ccipBridgedFrankencoin;

const CALLS_PER_CHAIN = 4;

/**
 * Reads the savings account of `account` on every supported chain, straight from the savings modules.
 * Interest is computed exactly like AbstractSavings.calculateInterest at the ticks of the read.
 */
export const useSavingsAccounts = (
	account: Address
): {
	accounts: SavingsChainAccount[];
	isLoading: boolean;
	updatedAt: number;
	refetch: () => void;
} => {
	const enabled = account != zeroAddress;

	const { data, isLoading, dataUpdatedAt, refetch } = useReadContracts({
		contracts: WAGMI_CHAINS.flatMap((chain) => {
			const chainId = chain.id as ChainId;
			const module = getSavingsModule(chainId);
			return [
				{ address: module, chainId, abi: SavingsABI, functionName: "savings", args: [account] },
				{ address: module, chainId, abi: SavingsABI, functionName: "currentTicks" },
				{ address: module, chainId, abi: SavingsABI, functionName: "currentRatePPM" },
				{ address: getFrankencoin(chainId), chainId, abi: erc20Abi, functionName: "balanceOf", args: [account] },
			] as const;
		}),
		query: { enabled, refetchInterval: 30_000 },
	});

	const accounts: SavingsChainAccount[] = WAGMI_CHAINS.map((chain, idx) => {
		const chainId = chain.id as ChainId;
		const base = idx * CALLS_PER_CHAIN;

		const savings = data?.[base]?.result as readonly [bigint, bigint, Address, number] | undefined;
		const saved = savings?.[0] ?? 0n;
		const ticks = savings?.[1] ?? 0n;
		const referrer = savings?.[2] ?? zeroAddress;
		const referralFeePPM = BigInt(savings?.[3] ?? 0);

		const currentTicks = data ? decodeBigIntCall(data[base + 1]) : 0n;
		const ratePPM = data ? decodeBigIntCall(data[base + 2]) : 0n;
		const walletBalance = data ? decodeBigIntCall(data[base + 3]) : 0n;

		const interest =
			ticks == 0n || currentTicks <= ticks ? 0n : ((currentTicks - ticks) * saved) / 1_000_000n / (365n * 24n * 60n * 60n);
		const referralFee = referrer != zeroAddress ? (interest * referralFeePPM) / 1_000_000n : 0n;
		const netInterest = interest - referralFee;
		const lockedSeconds = ticks > currentTicks && ratePPM > 0n ? (ticks - currentTicks) / ratePPM : 0n;

		return {
			chain: chain as SupportedChain,
			module: getSavingsModule(chainId),
			frankencoin: getFrankencoin(chainId),
			walletBalance,
			saved,
			ticks,
			ratePPM,
			referrer,
			referralFeePPM,
			interest,
			referralFee,
			netInterest,
			withdrawable: saved + netInterest,
			lockedSeconds,
			yearlyInterest: (saved * ratePPM * (1_000_000n - (referrer != zeroAddress ? referralFeePPM : 0n))) / 1_000_000n / 1_000_000n,
		};
	});

	return { accounts, isLoading: enabled && isLoading, updatedAt: dataUpdatedAt, refetch };
};
