import { mainnet, useNetwork } from "wagmi";

export const useIsWrongNetwork = () => {
  const network = useNetwork();
  const isWrongNetwork = network.chain && network.chain.id != mainnet.id;

  return isWrongNetwork;
};
