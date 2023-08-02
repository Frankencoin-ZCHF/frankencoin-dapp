import { mainnet } from "wagmi"

export const useChainId = () => {
  // const { chainId } = useAccount();
  // if (!chainId) return Mainnet.chainId;

  // return chainId;

  return mainnet.id
}