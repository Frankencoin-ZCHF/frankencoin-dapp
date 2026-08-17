// Maps lowercase collateral addresses to the ISO 3166-1 alpha-2 country codes
// that must be blocked from accessing pages for that collateral, per the
// jurisdictional restrictions of the underlying tokenized asset.
// Kept dependency-free (no viem/format imports) so it stays safe to bundle
// into the edge middleware.
const COLLATERAL_GEO_BLOCKS: Record<string, string[]> = {
	"0xfedc5f4a6c38211c1338aa411018dfaf26612c08": ["US"], // SPYon - SPDR S&P 500 ETF (Ondo Tokenized)
};

export function getBlockedCountriesForCollateral(address: string): string[] {
	return COLLATERAL_GEO_BLOCKS[address.toLowerCase()] ?? [];
}

export function isCollateralBlockedForCountry(address: string, countryCode: string | null | undefined): boolean {
	if (!countryCode) return false;
	return getBlockedCountriesForCollateral(address).includes(countryCode.toUpperCase());
}
