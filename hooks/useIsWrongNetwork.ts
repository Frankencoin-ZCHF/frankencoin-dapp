import { mainnet, useNetwork } from "wagmi";

export const useIsWrongNetwork = () => {
  const network = useNetwork();
  return network.chain && network.chain.id != mainnet.id;
};