import { GodEyeKind } from "./godeye.types";

export const KIND_META: Record<GodEyeKind, { color: string; name: string }> = {
	mint: { color: "#ff4d6d", name: "Mint / Burn" },
	wallet: { color: "#5ec8ff", name: "Wallets" },
	position: { color: "#ffb454", name: "Positions" },
	minter: { color: "#c58bff", name: "Minters & hubs" },
	savings: { color: "#4ade80", name: "Savings" },
	equity: { color: "#ffd84d", name: "Equity & reserve" },
	bridge: { color: "#ff8fd1", name: "Bridges" },
	dex: { color: "#38e8c6", name: "DEX pools" },
	contract: { color: "#9aa7b8", name: "Contracts" },
	others: { color: "#66728a", name: "Rest of network" },
};

export const KIND_ORDER = Object.keys(KIND_META) as GodEyeKind[];

export const EXPLORER: Record<number, string> = {
	1: "https://etherscan.io",
	10: "https://optimistic.etherscan.io",
	100: "https://gnosisscan.io",
	137: "https://polygonscan.com",
	146: "https://sonicscan.org",
	8453: "https://basescan.org",
	42161: "https://arbiscan.io",
	43114: "https://snowtrace.io",
};

export const WINDOWS = [
	{ label: "All time", value: 0 },
	{ label: "7 days", value: 604800 },
	{ label: "30 days", value: 2592000 },
	{ label: "90 days", value: 7776000 },
	{ label: "1 year", value: 31536000 },
];

export const SPEEDS = [
	{ label: "1 day / s", value: 86400 },
	{ label: "1 week / s", value: 604800 },
	{ label: "1 month / s", value: 2592000 },
	{ label: "3 months / s", value: 7776000 },
];
