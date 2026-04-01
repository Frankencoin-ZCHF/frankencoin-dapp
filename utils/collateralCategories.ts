export type CollateralCategory = "Bitcoin" | "Crypto" | "DeFi" | "Natural Resources" | "Stablecoins" | "Tokenized Securities";

export const ALL_CATEGORIES: CollateralCategory[] = [
	"Bitcoin",
	"Crypto",
	"DeFi",
	"Natural Resources",
	"Stablecoins",
	"Tokenized Securities",
];

// Maps lowercase collateral addresses to their categories.
// One collateral can belong to multiple categories.
const COLLATERAL_CATEGORIES: Record<string, CollateralCategory[]> = {
	// Bitcoin
	"0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": ["Bitcoin"], // WBTC
	"0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf": ["Bitcoin"], // cbBTC

	// Crypto / Ethereum ecosystem
	"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": ["Crypto"], // WETH
	"0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0": ["Crypto"], // wstETH
	"0x8c1bed5b9a0928467c9b1341da1d7bd5e10b6549": ["Crypto"], // LsETH

	// DeFi (some overlap with Crypto)
	"0x6810e776880c02933d47db1b9fc05908e5386b96": ["Crypto", "DeFi"], // GNO
	"0xd533a949740bb3306d119cc777fa900ba034cd52": ["Crypto", "DeFi"], // CRV

	// Natural Resources
	"0x68749665ff8d2d112fa859aa293f07a622782f38": ["Natural Resources"], // XAUt (Tether Gold)
	"0x45804880de22913dafe09f4980848ece6ecbaf78": ["Natural Resources"], // PAXG (Paxos Gold)

	// Stablecoins
	"0x79d4f0232a66c4c91b89c76362016a1707cfbf4f": ["Stablecoins"], // VCHF

	// Tokenized Securities
	"0x2e880962a9609aa3eab4def919fe9e917e99073b": ["Tokenized Securities"], // BOSS
	"0x553c7f9c780316fc1d34b8e14ac2465ab22a090b": ["Tokenized Securities"], // REALU
	"0x343324f53cbeee3ee6d171f2a20f005964c98047": ["Tokenized Securities"], // LENDS
};

export function getCategoriesForCollateral(address: string): CollateralCategory[] {
	return COLLATERAL_CATEGORIES[address.toLowerCase()] ?? ["Crypto"];
}

export function collateralMatchesCategories(address: string, activeCategories: CollateralCategory[]): boolean {
	if (activeCategories.length === 0) return true;
	const cats = getCategoriesForCollateral(address);
	return activeCategories.some((c) => cats.includes(c));
}
