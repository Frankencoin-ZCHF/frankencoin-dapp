import { Hash } from "viem";
import { useNetwork } from "wagmi";

export const useContractUrl = (address: string) => {
  const { chain } = useNetwork();
  return chain?.blockExplorers?.default.url + "/address/" + address;
};

export const useTxUrl = (hash: Hash) => {
  const { chain } = useNetwork();
  return chain?.blockExplorers?.default.url + "/tx/" + hash;
};
