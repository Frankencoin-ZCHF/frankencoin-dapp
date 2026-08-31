import { Address, encodeFunctionData, Hex } from "viem";
import { gnosis } from "viem/chains";
import { getPublicClient, sendCalls } from "@wagmi/core";
import {
	COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS,
	COW_PROTOCOL_VAULT_RELAYER_ADDRESS,
	ERC20_APPROVE_ABI,
	GPV2SettlementAbi,
	OrderBookApi,
	OrderKind,
	OrderSigningUtils,
	QuoteResults,
	setGlobalAdapter,
	SigningScheme,
	SupportedChainId,
	TradingSdk,
} from "@cowprotocol/cow-sdk";
import { ViemAdapter, ViemAdapterOptions } from "@cowprotocol/sdk-viem-adapter";
import { WAGMI_CONFIG } from "../app.config";

const COW_APP_CODE = "Frankencoin Migration";
const COW_CHAIN_ID = SupportedChainId.GNOSIS_CHAIN;

export const COW_SETTLEMENT_GNOSIS = COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS[COW_CHAIN_ID] as Address;
export const COW_VAULT_RELAYER_GNOSIS = COW_PROTOCOL_VAULT_RELAYER_ADDRESS[COW_CHAIN_ID] as Address;

let adapterInitialized = false;
function ensureCowAdapter() {
	if (adapterInitialized) return;
	// @wagmi/core's bundled viem Client type and the top-level viem PublicClient type are
	// structurally identical at runtime but resolve as distinct nominal types to TS here.
	const provider = getPublicClient(WAGMI_CONFIG, { chainId: gnosis.id }) as unknown as ViemAdapterOptions["provider"];
	setGlobalAdapter(new ViemAdapter({ provider }));
	adapterInitialized = true;
}

const tradingSdk = new TradingSdk({ chainId: COW_CHAIN_ID, appCode: COW_APP_CODE });
const orderBookApi = new OrderBookApi({ chainId: COW_CHAIN_ID });

export type MigrationQuoteParams = {
	owner: Address;
	sellToken: Address;
	sellTokenDecimals: number;
	buyToken: Address;
	buyTokenDecimals: number;
	sellAmount: bigint;
	slippageBps: number;
};

export async function getMigrationQuote(params: MigrationQuoteParams): Promise<QuoteResults> {
	ensureCowAdapter();

	return tradingSdk.getQuoteOnly({
		owner: params.owner,
		kind: OrderKind.SELL,
		sellToken: params.sellToken,
		sellTokenDecimals: params.sellTokenDecimals,
		buyToken: params.buyToken,
		buyTokenDecimals: params.buyTokenDecimals,
		amount: params.sellAmount.toString(),
		slippageBps: params.slippageBps,
	});
}

export type PresignBatchCall = {
	to: Address;
	data: Hex;
};

export type PresignBatchResult = {
	orderUid: Hex;
	calls: PresignBatchCall[];
};

// Builds the [approve, setPreSignature] pair for one token: posts the order to CoW's
// orderbook with the presign scheme, then returns the calldata for the on-chain half
// (a Safe wallet authorizes a presign order via setPreSignature, not an EIP-712 signature).
export async function buildPresignBatchCall(
	quote: QuoteResults,
	owner: Address,
	sellToken: Address,
	sellAmount: bigint
): Promise<PresignBatchResult> {
	ensureCowAdapter();

	// sdk-trading's UnsignedOrder and sdk-order-signing's ContractsOrder describe the same GPv2
	// order shape but declare separate (string-identical) enums for sellTokenBalance.
	const { orderId } = await OrderSigningUtils.generateOrderId(
		COW_CHAIN_ID,
		quote.orderToSign as unknown as Parameters<typeof OrderSigningUtils.generateOrderId>[1],
		{ owner }
	);

	await orderBookApi.uploadAppData(quote.appDataInfo.appDataKeccak256, quote.appDataInfo.fullAppData);

	await orderBookApi.sendOrder({
		...quote.orderToSign,
		appData: quote.appDataInfo.fullAppData,
		appDataHash: quote.appDataInfo.appDataKeccak256,
		from: owner,
		signature: owner,
		signingScheme: SigningScheme.PRESIGN,
		quoteId: quote.quoteResponse.id ?? undefined,
	});

	const orderUid = orderId as Hex;

	const approveCall: PresignBatchCall = {
		to: sellToken,
		data: encodeFunctionData({ abi: ERC20_APPROVE_ABI, functionName: "approve", args: [COW_VAULT_RELAYER_GNOSIS, sellAmount] }),
	};

	const presignCall: PresignBatchCall = {
		to: COW_SETTLEMENT_GNOSIS,
		data: encodeFunctionData({ abi: GPV2SettlementAbi, functionName: "setPreSignature", args: [orderUid, true] }),
	};

	return { orderUid, calls: [approveCall, presignCall] };
}

// Sends every token's [approve, setPreSignature] pair as one batched Safe transaction
// (EIP-5792 wallet_sendCalls) so the user signs once for all tokens.
export async function sendPresignBatch(calls: PresignBatchCall[]) {
	return sendCalls(WAGMI_CONFIG, {
		chainId: gnosis.id,
		calls,
		forceAtomic: true,
	});
}
