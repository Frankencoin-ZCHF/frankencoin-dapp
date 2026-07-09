// ABIs for the UniswapAmplifier factory and its AmplifiedPosition contracts.
// Source: Frankencoin repository, contracts/swap/UniswapAmplifier.sol

export const UniswapAmplifierABI = [
	{
		inputs: [
			{ internalType: "address", name: "uniswapPool_", type: "address" },
			{ internalType: "address", name: "zchf_", type: "address" },
			{ internalType: "address", name: "zchfMinter_", type: "address" },
			{ internalType: "uint40", name: "expiration", type: "uint40" },
			{ internalType: "uint256", name: "borrowingLimit", type: "uint256" },
		],
		stateMutability: "nonpayable",
		type: "constructor",
	},
	{ inputs: [], name: "AccessDenied", type: "error" },
	{ inputs: [], name: "AmplifierExpired", type: "error" },
	{
		inputs: [
			{ internalType: "uint256", name: "newValue", type: "uint256" },
			{ internalType: "uint256", name: "limit", type: "uint256" },
		],
		name: "LimitExceeded",
		type: "error",
	},
	{
		inputs: [
			{ internalType: "uint256", name: "found", type: "uint256" },
			{ internalType: "uint256", name: "expected", type: "uint256" },
		],
		name: "PriceChangedTooMuch",
		type: "error",
	},
	{
		inputs: [
			{ internalType: "int24", name: "min", type: "int24" },
			{ internalType: "int24", name: "found", type: "int24" },
			{ internalType: "int24", name: "max", type: "int24" },
		],
		name: "InvalidTick",
		type: "error",
	},
	{
		inputs: [
			{ internalType: "uint256", name: "requiredMinimum", type: "uint256" },
			{ internalType: "uint256", name: "actuallyFoundInProvidedRange", type: "uint256" },
		],
		name: "InsufficientDollarsInRange",
		type: "error",
	},
	{
		anonymous: false,
		inputs: [{ indexed: false, internalType: "address", name: "position", type: "address" }],
		name: "AmplifiedPositionCreated",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: false, internalType: "uint256", name: "borrowed", type: "uint256" },
			{ indexed: false, internalType: "uint256", name: "totalBorrowed", type: "uint256" },
		],
		name: "Borrowed",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
			{ indexed: false, internalType: "uint256", name: "totalBorrowed", type: "uint256" },
		],
		name: "Repaid",
		type: "event",
	},
	{
		inputs: [],
		name: "UNISWAP_POOL",
		outputs: [{ internalType: "contract IUniswapV3Pool", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "ZCHF_IS_TOKEN0",
		outputs: [{ internalType: "bool", name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "ZCHF",
		outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "USD",
		outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "ZCHF_MINTER",
		outputs: [{ internalType: "contract IFrankencoinMinter", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "PRICE_ANCHOR_X96",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "MINIMUM_TICK",
		outputs: [{ internalType: "int24", name: "", type: "int24" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "MAXIMUM_TICK",
		outputs: [{ internalType: "int24", name: "", type: "int24" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "MAX_DOLLAR_APPRECIATION_TICKS",
		outputs: [{ internalType: "int24", name: "", type: "int24" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "MAX_DOLLAR_DEPRECIATION_TICKS",
		outputs: [{ internalType: "int24", name: "", type: "int24" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "exploitableAt",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "EXPIRATION",
		outputs: [{ internalType: "uint40", name: "", type: "uint40" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "LIMIT",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "totalBorrowed",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "address", name: "", type: "address" }],
		name: "positionCreationDate",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "int24", name: "ticksLow", type: "int24" },
			{ internalType: "int24", name: "ticksHigh", type: "int24" },
		],
		name: "checkTicks",
		outputs: [],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "zchfAmount", type: "uint256" }],
		name: "getMinimumDollars",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "getPrice",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "expectedPriceX96", type: "uint256" }],
		name: "checkPrice",
		outputs: [],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "int24", name: "tickLow", type: "int24" },
			{ internalType: "int24", name: "tickHigh", type: "int24" },
		],
		name: "createAmplifiedPosition",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;

// Minimal interface of the FrankencoinTestMinter used by test deployments: it hands out
// previously deposited ZCHF instead of minting, tracked per depositor.
export const FrankencoinTestMinterABI = [
	{
		inputs: [{ internalType: "address", name: "", type: "address" }],
		name: "deposits",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
		name: "deposit",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;

export const AmplifiedPositionABI = [
	{ inputs: [{ internalType: "address", name: "sender", type: "address" }], name: "AccessDenied", type: "error" },
	{ inputs: [], name: "NotExpired", type: "error" },
	{ inputs: [], name: "NotOwner", type: "error" },
	{
		anonymous: false,
		inputs: [
			{ indexed: false, internalType: "uint128", name: "liquidityAdded", type: "uint128" },
			{ indexed: false, internalType: "uint256", name: "token0", type: "uint256" },
			{ indexed: false, internalType: "uint256", name: "token1", type: "uint256" },
			{ indexed: false, internalType: "uint256", name: "borrowed", type: "uint256" },
		],
		name: "Mint",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: false, internalType: "uint128", name: "liquidityRemoved", type: "uint128" },
			{ indexed: false, internalType: "uint256", name: "token0", type: "uint256" },
			{ indexed: false, internalType: "uint256", name: "token1", type: "uint256" },
			{ indexed: false, internalType: "uint256", name: "repaid", type: "uint256" },
		],
		name: "Burn",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "address", name: "previousOwner", type: "address" },
			{ indexed: true, internalType: "address", name: "newOwner", type: "address" },
		],
		name: "OwnershipTransferred",
		type: "event",
	},
	{
		inputs: [],
		name: "owner",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
		name: "transferOwnership",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "tickLow",
		outputs: [{ internalType: "int24", name: "", type: "int24" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "tickHigh",
		outputs: [{ internalType: "int24", name: "", type: "int24" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "borrowed",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "totalLiquidity",
		outputs: [{ internalType: "uint128", name: "liquidity", type: "uint128" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint128", name: "amount", type: "uint128" },
			{ internalType: "uint256", name: "expectedPriceX96", type: "uint256" },
		],
		name: "mint",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint128", name: "burnedLiquidity", type: "uint128" },
			{ internalType: "uint256", name: "expectedPriceX96", type: "uint256" },
		],
		name: "burn",
		outputs: [
			{ internalType: "uint256", name: "", type: "uint256" },
			{ internalType: "uint256", name: "", type: "uint256" },
		],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint128", name: "burnedLiquidity", type: "uint128" },
			{ internalType: "uint256", name: "expectedPriceX96", type: "uint256" },
		],
		name: "expiredPublicBurn",
		outputs: [
			{ internalType: "uint256", name: "", type: "uint256" },
			{ internalType: "uint256", name: "", type: "uint256" },
		],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint256", name: "amount0Owed", type: "uint256" },
			{ internalType: "uint256", name: "amount1Owed", type: "uint256" },
			{ internalType: "bytes", name: "", type: "bytes" },
		],
		name: "uniswapV3MintCallback",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;
