import { Address, concatHex, encodeAbiParameters, Hex } from "viem";

// Chainlink CCIP EVMExtraArgsV2 tag, see @chainlink/contracts-ccip Client.sol
const EVM_EXTRA_ARGS_V2_TAG: Hex = "0x181dcf10";

export type EVMTokenAmount = {
	token: Address;
	amount: bigint;
};

export type EVM2AnyMessage = {
	receiver: Hex;
	data: Hex;
	tokenAmounts: EVMTokenAmount[];
	feeToken: Address;
	extraArgs: Hex;
};

export function encodeCCIPExtraArgsV2(gasLimit: bigint, allowOutOfOrderExecution: boolean): Hex {
	return concatHex([
		EVM_EXTRA_ARGS_V2_TAG,
		encodeAbiParameters([{ type: "uint256" }, { type: "bool" }], [gasLimit, allowOutOfOrderExecution]),
	]);
}

export function buildCCIPTokenAndDataMessage(params: {
	receiver: Address;
	recipient: Address;
	token: Address;
	amount: bigint;
	gasLimit: bigint;
}): EVM2AnyMessage {
	return {
		receiver: encodeAbiParameters([{ type: "address" }], [params.receiver]),
		data: encodeAbiParameters([{ type: "address" }], [params.recipient]),
		tokenAmounts: [{ token: params.token, amount: params.amount }],
		feeToken: "0x0000000000000000000000000000000000000000",
		extraArgs: encodeCCIPExtraArgsV2(params.gasLimit, false),
	};
}
