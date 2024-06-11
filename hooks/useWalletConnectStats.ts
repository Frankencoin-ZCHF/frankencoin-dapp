import { useWeb3ModalState } from "@web3modal/wagmi/react";
import { sepolia } from "viem/chains";
import { useAccount } from "wagmi";

export const useIsConnectedToCorrectChain = (): boolean => {
	const { address, chain, isConnected } = useAccount();
	const { selectedNetworkId } = useWeb3ModalState();

	if (!isConnected || !chain || !address) return false;
	return selectedNetworkId ? parseInt(selectedNetworkId) === chain.id : false;
};

export const useIsSepoliaChain = (): boolean => {
	const { selectedNetworkId } = useWeb3ModalState();
	return selectedNetworkId ? parseInt(selectedNetworkId) === (sepolia.id as number) : false;
};
