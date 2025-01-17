import { TokenDescriptor } from "../../hooks/useWalletBalances";

export const MAX_LIQUIDATION_PRICE_DECREASE = [
	{
		symbol: "WETH",
		address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		price: {
			usd: 3221.36,
			eur: 2928.51,
		},
	},
];
// To be removed
export const TOKEN_OPTIONS: TokenDescriptor[] = [
	{
		symbol: "WETH",
		name: "Wrapped Ether",
		address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
	},
];
// TODO: remove fake data
export const LIST = [
	{
		version: 2,
		position: "0x49C431454C40ecbf848096f2753B2ABC3A699a10",
		owner: "0x963eC454423CD543dB08bc38fC7B3036B425b301",
		deuro: "0xB58E61C3098d85632Df34EecfB899A1Ed80921cB",
		collateral: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		price: "2500000000000000000000",
		created: 1733946503,
		isOriginal: true,
		isClone: false,
		denied: false,
		closed: false,
		original: "0x49C431454C40ecbf848096f2753B2ABC3A699a10",
		parent: "0x49C431454C40ecbf848096f2753B2ABC3A699a10",
		minimumCollateral: "2000000000000000000",
		annualInterestPPM: 50000,
		riskPremiumPPM: 0,
		reserveContribution: 250000,
		start: 1734378503,
		cooldown: 1734378503,
		expiration: 1827690503,
		challengePeriod: 86400,
		deuroName: "dEURO",
		deuroSymbol: "dEURO",
		deuroDecimals: 18,
		collateralName: "Wrapped Ether",
		collateralSymbol: "WETH",
		collateralDecimals: 18,
		collateralBalance: "2000000000000000000",
		limitForPosition: "5000000000000000000000",
		limitForClones: "10000000000000000000000000",
		availableForClones: "9995000000000000000000000",
		availableForMinting: "10000000000000000000000000",
		availableForPosition: "5000000000000000000000",
		minted: "0",
	},
];
// TODO: remove fake data
export const PRICES = {
	"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": {
		address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		name: "Wrapped Ether",
		symbol: "WETH",
		decimals: 18,
		timestamp: 1736880208709,
		price: {
			usd: 3221.36,
			eur: 2928.51,
		},
	},
};
