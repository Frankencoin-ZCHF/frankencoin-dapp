import { useWeb3ModalState } from "@web3modal/wagmi/react";
import { mainnet } from "viem/chains";
import { useAccount } from "wagmi";
import { WAGMI_CHAIN } from "../app.config";

export const useIsConnectedToCorrectChain = (): boolean => {
	const { address, chain, isConnected } = useAccount();
	const { selectedNetworkId } = useWeb3ModalState();

	if (!isConnected || !chain || !address) return false;
	return selectedNetworkId ? parseInt(selectedNetworkId) === chain.id : false;
};

export const useIsMainnet = (): boolean => {
	return (WAGMI_CHAIN.id as number) === (mainnet.id as number);
};
