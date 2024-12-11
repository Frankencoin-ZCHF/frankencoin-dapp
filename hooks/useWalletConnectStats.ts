import { mainnet } from "viem/chains";
import { useAccount } from "wagmi";
import { WAGMI_CHAIN } from "../app.config";

export const useIsConnectedToCorrectChain = (): boolean => {
	const { address, chain, isConnected } = useAccount();

	if (!isConnected || !chain || !address) return false;
	return (WAGMI_CHAIN.id as number) === (chain.id as number);
};

export const useIsMainnet = (): boolean => {
	return (WAGMI_CHAIN.id as number) === (mainnet.id as number);
};
