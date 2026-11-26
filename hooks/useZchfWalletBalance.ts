import { useConnection, useReadContracts } from "wagmi";
import { erc20Abi, zeroAddress } from "viem";
import { ChainId } from "@frankencoin/zchf";
import { WAGMI_CHAINS } from "../app.config";
import { decodeBigIntCall } from "@utils";
import { getFrankencoin } from "./useSavingsAccounts";

/**
 * ZCHF held by the connected wallet, summed over all supported chains.
 * `isKnown` is false while no wallet is connected or the balances are still loading,
 * so callers can tell "holds nothing" apart from "not known yet".
 */
export const useZchfWalletBalance = (): { total: bigint; isConnected: boolean; isKnown: boolean } => {
	const { address } = useConnection();
	const isConnected = address != undefined;

	const { data } = useReadContracts({
		contracts: WAGMI_CHAINS.map((chain) => ({
			address: getFrankencoin(chain.id as ChainId),
			chainId: chain.id,
			abi: erc20Abi,
			functionName: "balanceOf",
			args: [address ?? zeroAddress],
		})),
		query: { enabled: isConnected, refetchInterval: 30_000 },
	});

	const total = data ? data.reduce((sum, d) => sum + decodeBigIntCall(d), 0n) : 0n;
	return { total, isConnected, isKnown: isConnected && data != undefined };
};
