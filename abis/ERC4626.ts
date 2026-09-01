// Minimal ERC-4626 (Tokenized Vault) interface — https://eips.ethereum.org/EIPS/eip-4626
// Only the entries the app needs (redeem + its preview). Not part of @frankencoin/zchf.

export const ERC4626ABI = [
	{
		inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
		name: "previewRedeem",
		outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint256", name: "shares", type: "uint256" },
			{ internalType: "address", name: "receiver", type: "address" },
			{ internalType: "address", name: "owner", type: "address" },
		],
		name: "redeem",
		outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;
