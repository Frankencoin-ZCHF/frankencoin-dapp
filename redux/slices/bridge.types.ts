export type ApiCCIPProposal = {
	chainId: number;
	hash: string;
	proposer: string | null;
	type: string | null;
	deadline: number;
	status: string;
	details: string | null;
	created: number;
	txHash: string;
	deniedAt: number | null;
	deniedTxHash: string | null;
	enactedAt: number | null;
	enactedTxHash: string | null;
};

export type ApiCCIPChain = {
	chainId: number;
	remoteChainSelector: string;
	active: boolean;
	remoteTokenAddress: string | null;
	outboundEnabled: boolean;
	outboundCapacity: string;
	outboundRate: string;
	inboundEnabled: boolean;
	inboundCapacity: string;
	inboundRate: string;
	rateLimitUpdatedAt: number | null;
};

export type BridgeState = {
	error: string | null;
	loaded: boolean;
	proposals: ApiCCIPProposal[];
	chains: ApiCCIPChain[];
};
