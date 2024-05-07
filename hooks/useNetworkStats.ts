import { mainnet, useNetwork } from "wagmi";

export const useIsEthereumMainnet = () => {
  const network = useNetwork();
  return network.chain && network.chain.id === mainnet.id;
};