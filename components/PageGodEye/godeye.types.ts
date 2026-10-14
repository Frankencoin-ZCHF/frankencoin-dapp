// Mirrors the /godeye endpoints of @frankencoin/api (src/modules/godeye)

export type GodEyeKind = "mint" | "wallet" | "position" | "minter" | "savings" | "equity" | "bridge" | "dex" | "contract" | "others";

export type GodEyeTokenInfo = {
	key: string;
	chainId: number;
	chain: string;
	token: string;
	symbol: string;
	transfers: number;
	firstTs: number;
	lastTs: number;
	syncedAt: number;
};

export type GodEyeSync = {
	syncing: boolean;
	phase: "idle" | "positions" | "ledgers";
	lastRun: number;
	lastError: string | null;
	ledgers: number;
	progress: number;
	done: number;
	target: number;
	ready: boolean;
};

export type GodEyeNode = {
	id: string;
	label: string | null;
	kind: GodEyeKind;
	balance: number;
	share: number;
	inflow: number;
	outflow: number;
	txs: number;
	first: number;
	last: number;
};

export type GodEyeEdge = { s: string; t: string; amount: number; count: number; first: number; last: number; via?: boolean };

export type GodEyeKindStats = { kind: GodEyeKind; addresses: number; balance: number; inflow: number; outflow: number };

export type GodEyeMode = "entities" | "categories";
export type GodEyeRank = "balance" | "volume";

export type GodEyeGraph = {
	token: GodEyeTokenInfo;
	mode: GodEyeMode;
	at: number;
	from: number;
	supply: number;
	holders: number;
	totalNodes: number;
	coverage: number;
	nodes: GodEyeNode[];
	edges: GodEyeEdge[];
	kinds: GodEyeKindStats[];
	focus?: string;
};

export type GodEyeTimelinePoint = { t: number; supply: number; holders: number; volume: number; minted: number; burned: number; transfers: number };

export type GodEyeHolder = { address: string; label: string | null; kind: GodEyeKind; balance: number; share: number; since: number };

export type GodEyeHolders = {
	at: number;
	supply: number;
	holders: number;
	top1: number;
	top10: number;
	top100: number;
	buckets: { label: string; holders: number; balance: number }[];
	total: number;
	list: GodEyeHolder[];
};

export type GodEyePeer = { address: string; label: string | null; kind: GodEyeKind; amount: number; count: number; last: number };
export type GodEyeOrigin = GodEyePeer & { via: GodEyePeer[] };

export type GodEyeAddress = {
	address: string;
	label: string | null;
	kind: GodEyeKind;
	token: GodEyeTokenInfo;
	balance: number;
	share: number;
	inflow: number;
	outflow: number;
	minted: number;
	burned: number;
	txs: number;
	first: number;
	last: number;
	history: { t: number; balance: number }[];
	sources: GodEyePeer[];
	destinations: GodEyePeer[];
	origin: GodEyeOrigin[];
	recent: { txHash: string; t: number; from: string; to: string; amount: number }[];
};

export type GodEyeSearchHit = { address: string; label: string | null; kind: GodEyeKind };
