import { Hash } from "viem";
import { ADDRESS, ChainId, SupportedChain, SupportedChains } from "@frankencoin/zchf";
import { CONFIG, WAGMI_CHAIN, WAGMI_CHAINS } from "../app.config";
import path from "path";
import { toast } from "react-toastify";

export const AppUrl = (url: string) => {
	return path.join(CONFIG.app, url);
};

export const ContractUrl = (address: string, chain: SupportedChain = SupportedChains["mainnet"]) => {
	const explorerLink = chain?.blockExplorers?.default?.url || "https://etherscan.io/";
	// path.join throws "Path must be a string. Received undefined" if address is
	// missing (e.g. a malformed API row), which would crash the whole page.
	if (!address) return explorerLink;
	return path.join(explorerLink, "address", address);
};

export const TxUrl = (hash: Hash, chain: SupportedChain = SupportedChains["mainnet"]) => {
	const explorerLink = chain?.blockExplorers?.default?.url || "https://etherscan.io/";
	// Guard against undefined hash for the same reason as ContractUrl above.
	if (!hash) return explorerLink;
	return path.join(explorerLink, "tx", hash);
};

export const getChain = (id: ChainId) => {
	return WAGMI_CHAINS.find((c) => c.id == id) ?? WAGMI_CHAIN;
};

export const getChainByName = (name: string) => {
	return WAGMI_CHAINS.find((c) => c.name.toLowerCase() == name.toLowerCase()) ?? WAGMI_CHAIN;
};

export const getChainByChainSelector = (selector: string | bigint) => {
	const keys = Object.keys(ADDRESS);
	const chainId = keys.find((v, idx) => ADDRESS[Number(v) as ChainId].chainSelector == selector);
	return getChain(Number(chainId) as ChainId);
};

export function showErrorToast({ module, message, error }: { module?: string; message: string; error: unknown }) {
	toast.error(`${module ?? "API Error:"} ${message}\n${error}`, { position: "bottom-right" });
}
