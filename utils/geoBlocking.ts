// Maps lowercase collateral addresses to the ISO 3166-1 alpha-2 country codes
// that must be blocked from accessing pages for that collateral, per the
// jurisdictional restrictions of the underlying tokenized asset.
// Kept dependency-free (no viem/format imports) so it stays safe to bundle

import { normalizeAddress } from "./format";

// into the edge middleware.
//
// SPYon list is Ondo's "Jurisdiction-Based Prohibitions" (Ondo GM tokens). Country-level
// only, since cf-ipcountry can't resolve sub-national regions - the source list's
// Crimea/DNR/LNR/Kherson/Zaporizhzhia/Sevastopol entries are approximated here by
// blocking Ukraine (UA) entirely, rather than left uncovered.
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
		"UA", // Ukraine (approximates Crimea / DNR / LNR / Kherson / Zaporizhzhia / Sevastopol)
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
