import { useNetwork } from "wagmi";

export const useIsConnectedToCorrectChain = () => {
	const Network = useNetwork();

	const walletChain = Network.chain;
	const availableChains = Network.chains;
	const availableChainIds = availableChains.map((c) => c.id);
	const isCorrectChain = walletChain ? availableChainIds.includes(walletChain?.id) : false;

	return isCorrectChain;
};
