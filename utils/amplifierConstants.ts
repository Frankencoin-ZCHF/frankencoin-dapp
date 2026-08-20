import { Address } from "viem";
import { mainnet, optimism } from "viem/chains";
import { ChainId, SupportedChain, SupportedChains, SupportedChainsMap } from "@frankencoin/zchf";

// The test amplifier on mainnet. Its minter does not mint new ZCHF but hands out ZCHF
// supplied by volunteers.
export const TEST_AMPLIFIER: Address = "0x560E4889e01f41612133Af0a363dD686534c2dA7";

export type KnownAmplifier = {
	address: Address;
	chainId: ChainId;
	isTest?: boolean;
};

// All deployed UniswapAmplifier contracts, shown in the overview table at /amplifier.
export const KNOWN_AMPLIFIERS: KnownAmplifier[] = [
	{ address: "0xa1304E5Aaf83CDB7c2b367F50B99Bb0647ED8C58", chainId: mainnet.id },
	{ address: "0x15CE921192ad967Eb65ea1cc508DfA21120F0d8F", chainId: optimism.id },
	{ address: TEST_AMPLIFIER, chainId: mainnet.id, isTest: true },
];

export const isTestAmplifier = (address: Address | undefined): boolean =>
	address != undefined && address.toLowerCase() === TEST_AMPLIFIER.toLowerCase();

export const getAmplifierChain = (chainId: number): SupportedChain =>
	(SupportedChainsMap[chainId as ChainId] ?? mainnet) as SupportedChain;

// the key under which a chain is listed in SupportedChains (e.g. "optimism"), used in URLs
export const chainKey = (chainId: number): string => Object.entries(SupportedChains).find(([, c]) => c.id === chainId)?.[0] ?? "mainnet";

/**
 * Resolves the chain of an amplifier page from the "chain" query parameter (a chain key
 * like "optimism" or a numeric chain id), falling back to the registered chain of a
 * known amplifier and finally to mainnet.
 */
export const resolveAmplifierChainId = (chainParam: string | undefined, amplifier: Address | undefined): ChainId => {
	if (chainParam) {
		const byKey = SupportedChains[chainParam.toLowerCase() as keyof typeof SupportedChains];
		if (byKey) return byKey.id;
		const byId = Object.values(SupportedChains).find((c) => c.id === Number(chainParam));
		if (byId) return byId.id;
	}
	const known = amplifier && KNOWN_AMPLIFIERS.find((a) => a.address.toLowerCase() === amplifier.toLowerCase());
	return known ? known.chainId : mainnet.id;
};

// link to the page of an individual amplifier
export const amplifierPageLink = (amplifier: KnownAmplifier): string =>
	`/amplifier?contract=${amplifier.address}${amplifier.chainId === mainnet.id ? "" : `&chain=${chainKey(amplifier.chainId)}`}`;

// the chain slug used in Uniswap web app links
export const uniswapChainSlug = (chainId: number): string => (chainId === mainnet.id ? "ethereum" : chainKey(chainId));
