// Maps lowercase collateral addresses to the ISO 3166-1 alpha-2 country codes
// that must be blocked from accessing pages for that collateral, per the
// jurisdictional restrictions of the underlying tokenized asset.
// Kept dependency-free (no viem/format imports) so it stays safe to bundle

import { normalizeAddress } from "./format";

// into the edge middleware.
//
// SPYon list is Ondo's "Jurisdiction-Based Prohibitions" (Ondo GM tokens). Country-level
// only, since cf-ipcountry can't resolve sub-national regions - the Crimea/DNR/LNR/Kherson/
// Zaporizhzhia/Sevastopol entries on that list have no ISO country code and aren't covered
// here; they'd need separate enforcement (e.g. blocking wallet addresses on an OFAC list).
const COLLATERAL_GEO_BLOCKS: Record<string, string[]> = {
	"0xfedc5f4a6c38211c1338aa411018dfaf26612c08": [
		"AF", // Afghanistan
		"BY", // Belarus
		"CA", // Canada
		"CU", // Cuba
		"KP", // Democratic People's Republic of Korea
		"IR", // Iran
		"LY", // Libya
		"MM", // Myanmar
		"RU", // Russia
		"SO", // Somalia
		"SS", // South Sudan
		"SD", // Sudan
		"SY", // Syria
		"US", // United States (incl. all territories & federal districts)
	], // SPYon - SPDR S&P 500 ETF (Ondo Tokenized)
};

export function getBlockedCountriesForCollateral(address: string): string[] {
	return COLLATERAL_GEO_BLOCKS[normalizeAddress(address)] ?? [];
}

export function isCollateralBlockedForCountry(address: string, countryCode: string | null | undefined): boolean {
	if (!countryCode) return false;
	return getBlockedCountriesForCollateral(address).includes(countryCode.toUpperCase());
}
