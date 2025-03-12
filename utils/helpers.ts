import { Chain, Hash } from "viem";
import { WAGMI_CHAIN } from "../app.config";

export const ContractUrl = (address: string, chain: Chain = WAGMI_CHAIN) => {
	const explorerLink = chain?.blockExplorers?.default.url || "https://etherscan.io";
	return explorerLink + "/address/" + address;
};

export const TxUrl = (hash: Hash, chain: Chain = WAGMI_CHAIN) => {
	const explorerLink = chain?.blockExplorers?.default.url || "https://etherscan.io";
	return explorerLink + "/tx/" + hash;
};

export const MorphoMarketUrl = (id: string) => `https://app.morpho.org/ethereum/market/${id}`;
