import { Chain, Hash } from "viem";
import { CONFIG, WAGMI_CHAIN } from "../app.config";
import path from "path";

export const AppUrl = (url: string) => {
	return path.join(CONFIG.app, url);
};

export const ContractUrl = (address: string, chain: Chain = WAGMI_CHAIN) => {
	const explorerLink = chain?.blockExplorers?.default.url || "https://etherscan.io/";
	return path.join(explorerLink, "address", address);
};

export const TxUrl = (hash: Hash, chain: Chain = WAGMI_CHAIN) => {
	const explorerLink = chain?.blockExplorers?.default.url || "https://etherscan.io/";
	return path.join(explorerLink, "tx", hash);
};

export const MorphoMarketUrl = (id: string) => `https://app.morpho.org/ethereum/market/${id}`;
