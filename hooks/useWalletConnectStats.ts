import { mainnet } from "viem/chains";
import { useAccount } from "wagmi";
import { WAGMI_CHAIN, CONFIG } from "../app.config";

export const useIsConnectedToCorrectChain = (): boolean => {
	const { address, chain, isConnected } = useAccount();

	// If Web3Modal is not initialized, skip the network check
	if (!CONFIG.wagmiId) {
		return false;
	}

	// Dynamically import only if Web3Modal is initialized
	try {
		const { useWeb3ModalState } = require("@web3modal/wagmi/react");
		const { selectedNetworkId } = useWeb3ModalState();

		if (!isConnected || !chain || !address) return false;
		return selectedNetworkId ? parseInt(selectedNetworkId) === chain.id : false;
	} catch {
		// If useWeb3ModalState fails, fall back to basic check
		if (!isConnected || !chain || !address) return false;
		return chain.id === WAGMI_CHAIN.id;
	}
};

export const useIsMainnet = (): boolean => {
	return (WAGMI_CHAIN.id as number) === (mainnet.id as number);
};
