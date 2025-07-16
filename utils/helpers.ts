import { Hash } from "viem";
import { ChainId, SupportedChain, SupportedChains } from "@frankencoin/zchf";
import { CONFIG, WAGMI_CHAIN, WAGMI_CHAINS } from "../app.config";
import path from "path";

export const AppUrl = (url: string) => {
	return path.join(CONFIG.app, url);
};

export const ContractUrl = (address: string, chain: SupportedChain = SupportedChains["mainnet"]) => {
	const explorerLink = chain?.blockExplorers?.default.url || "https://etherscan.io/";
	return path.join(explorerLink, "address", address);
};

export const TxUrl = (hash: Hash, chain: SupportedChain = SupportedChains["mainnet"]) => {
	const explorerLink = chain?.blockExplorers?.default.url || "https://etherscan.io/";
	return path.join(explorerLink, "tx", hash);
};

export const MorphoMarketUrl = (id: string) => `https://app.morpho.org/ethereum/market/${id}`;

export const getChain = (id: ChainId) => {
	return WAGMI_CHAINS.find((c) => c.id == id) ?? WAGMI_CHAIN;
};
