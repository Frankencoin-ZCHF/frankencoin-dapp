import { Hash } from "viem";
import { WAGMI_CHAIN } from "../app.config";
import { SupportedChain } from "@frankencoin/zchf";

export const useContractUrl = (address: string, chain: SupportedChain = WAGMI_CHAIN) => {
	const explorerLink = chain?.blockExplorers?.default.url || "https://etherscan.io";
	return explorerLink + "/address/" + address;
};

export const useTxUrl = (hash: Hash, chain: SupportedChain = WAGMI_CHAIN) => {
	const explorerLink = chain?.blockExplorers?.default.url || "https://etherscan.io";
	return explorerLink + "/tx/" + hash;
};
