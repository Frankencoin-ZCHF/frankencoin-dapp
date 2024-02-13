import { Hash } from "viem";
import { useNetwork } from "wagmi";

export const useContractUrl = (address: string) => {
  const { chain } = useNetwork();
  const explorerLink =
    chain?.blockExplorers?.default.url || "https://etherscan.io";
  return explorerLink + "/address/" + address;
};

export const useTxUrl = (hash: Hash) => {
  const { chain } = useNetwork();
  const explorerLink =
    chain?.blockExplorers?.default.url || "https://etherscan.io";
  return explorerLink + "/tx/" + hash;
};
