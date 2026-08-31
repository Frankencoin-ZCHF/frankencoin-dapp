// Chainlink CCIP IRouterClient interface + Client.EVM2AnyMessage struct.
// Source: @chainlink/contracts-ccip (IRouterClient.sol, Client.sol) — not part of @frankencoin/zchf.

export const CCIPRouterABI = [
	{
		inputs: [{ internalType: "uint64", name: "destChainSelector", type: "uint64" }],
		name: "UnsupportedDestinationChain",
		type: "error",
	},
	{ inputs: [], name: "InsufficientFeeTokenAmount", type: "error" },
	{ inputs: [], name: "InvalidMsgValue", type: "error" },
	{
		inputs: [{ internalType: "uint64", name: "chainSelector", type: "uint64" }],
		name: "isChainSupported",
		outputs: [{ internalType: "bool", name: "supported", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint64", name: "destinationChainSelector", type: "uint64" },
			{
				internalType: "struct Client.EVM2AnyMessage",
				name: "message",
				type: "tuple",
				components: [
					{ internalType: "bytes", name: "receiver", type: "bytes" },
					{ internalType: "bytes", name: "data", type: "bytes" },
					{
						internalType: "struct Client.EVMTokenAmount[]",
						name: "tokenAmounts",
						type: "tuple[]",
						components: [
							{ internalType: "address", name: "token", type: "address" },
							{ internalType: "uint256", name: "amount", type: "uint256" },
						],
					},
					{ internalType: "address", name: "feeToken", type: "address" },
					{ internalType: "bytes", name: "extraArgs", type: "bytes" },
				],
			},
		],
		name: "getFee",
		outputs: [{ internalType: "uint256", name: "fee", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint64", name: "destinationChainSelector", type: "uint64" },
			{
				internalType: "struct Client.EVM2AnyMessage",
				name: "message",
				type: "tuple",
				components: [
					{ internalType: "bytes", name: "receiver", type: "bytes" },
					{ internalType: "bytes", name: "data", type: "bytes" },
					{
						internalType: "struct Client.EVMTokenAmount[]",
						name: "tokenAmounts",
						type: "tuple[]",
						components: [
							{ internalType: "address", name: "token", type: "address" },
							{ internalType: "uint256", name: "amount", type: "uint256" },
						],
					},
					{ internalType: "address", name: "feeToken", type: "address" },
					{ internalType: "bytes", name: "extraArgs", type: "bytes" },
				],
			},
		],
		name: "ccipSend",
		outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
		stateMutability: "payable",
		type: "function",
	},
] as const;
