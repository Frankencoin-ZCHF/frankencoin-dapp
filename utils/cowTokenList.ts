const GNOSIS_CHAIN_ID = 100;

type CowTokenListEntry = {
	chainId: number;
	address: string;
	logoURI?: string;
};

let cache: Map<string, string> | null = null;
let inflight: Promise<Map<string, string>> | null = null;

async function loadCowLogoMap(): Promise<Map<string, string>> {
	if (cache) return cache;
	if (inflight) return inflight;

	inflight = fetch("https://files.cow.fi/tokens/CowSwap.json")
		.then((res) => res.json())
		.then((data: { tokens: CowTokenListEntry[] }) => {
			const map = new Map<string, string>();
			for (const token of data.tokens ?? []) {
				if (token.chainId === GNOSIS_CHAIN_ID && token.logoURI) {
					map.set(token.address.toLowerCase(), token.logoURI);
				}
			}
			cache = map;
			return map;
		})
		.catch(() => {
			cache = new Map();
			return cache;
		});

	return inflight;
}

// Looks up a Gnosis Chain token's logo from CoW Protocol's hosted token list, by address.
export async function getCowLogoURI(address: string): Promise<string | undefined> {
	const map = await loadCowLogoMap();
	return map.get(address.toLowerCase());
}
