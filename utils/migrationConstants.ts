import { Address } from "viem";

export type MigrationToken = {
	address: Address;
	symbol: string;
	name: string;
	decimals: number;
	logoURI: string;
};

// Top 10 tokens by Gnosis Chain holder count/TVL, shown in step 1. Addresses and logoURIs
// verified against gnosisscan.io (Blockscout) and the CoW Protocol token list on 2026-08-31.
export const MIGRATION_TOKENS: MigrationToken[] = [
	{
		address: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
		symbol: "USDC",
		name: "Bridged USDC",
		decimals: 6,
		logoURI: "https://files.cow.fi/token-lists/images/100/0xddafbb505ad214d7b80b1f830fccc89b60fb7a83/logo.png",
	},
	{
		address: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
		symbol: "WXDAI",
		name: "Wrapped XDAI",
		decimals: 18,
		logoURI:
			"https://raw.githubusercontent.com/centfinance/assets/master/blockchains/xdai/assets/0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d/logo.png",
	},
	{
		address: "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
		symbol: "WETH",
		name: "Wrapped Ether on Gnosis Chain",
		decimals: 18,
		logoURI: "https://files.cow.fi/token-lists/images/100/0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1/logo.png",
	},
	{
		address: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
		symbol: "GNO",
		name: "Gnosis",
		decimals: 18,
		logoURI: "https://files.cow.fi/token-lists/images/100/0x9c58bacc331c9aa871afd802db6379a98e80cedb/logo.png",
	},
	{
		address: "0x2a22f9c3b484c3629090FeED35F17Ff8F88f76F0",
		symbol: "USDC.e",
		name: "USDC (native)",
		decimals: 6,
		logoURI: "https://files.cow.fi/token-lists/images/100/0x2a22f9c3b484c3629090feed35f17ff8f88f76f0/logo.png",
	},
	{
		address: "0x4ECaBa5870353805a9F068101A40E0f32ed605C6",
		symbol: "USDT",
		name: "Tether USD on xDai",
		decimals: 6,
		logoURI: "https://files.cow.fi/token-lists/images/100/0x4ecaba5870353805a9f068101a40e0f32ed605c6/logo.png",
	},
	{
		address: "0xaf204776c7245bF4147c2612BF6e5972Ee483701",
		symbol: "sDAI",
		name: "Savings xDAI",
		decimals: 18,
		logoURI: "https://files.cow.fi/token-lists/images/100/0xaf204776c7245bf4147c2612bf6e5972ee483701/logo.png",
	},
	{
		address: "0x177127622c4A00F3d409B75571e12cB3c8973d3c",
		symbol: "COW",
		name: "CoW Protocol Token",
		decimals: 18,
		logoURI: "https://files.cow.fi/token-lists/images/100/0x177127622c4a00f3d409b75571e12cb3c8973d3c/logo.png",
	},
	{
		address: "0x4d18815D14fe5c3304e87B3FA18318baa5c23820",
		symbol: "SAFE",
		name: "Safe Token",
		decimals: 18,
		logoURI: "https://files.cow.fi/token-lists/images/100/0x4d18815d14fe5c3304e87b3fa18318baa5c23820/logo.png",
	},
	{
		address: "0x6C76971f98945AE98dD7d4DFcA8711ebea946eA6",
		symbol: "wstETH",
		name: "Wrapped liquid staked Ether 2.0",
		decimals: 18,
		logoURI: "https://files.cow.fi/token-lists/images/100/0x6c76971f98945ae98dd7d4dfca8711ebea946ea6/logo.png",
	},
];

// CCIPWrapper (CCIPReceiver) on Optimism — deposits received ZCHF into svZCHF on behalf of the
// recipient encoded in the CCIP message data. Not deployed yet; replace once live.
export const CCIP_WRAPPER_OPTIMISM: Address = "0x0000000000000000000000000000000000000000";

export const CCIP_SEND_GAS_LIMIT = 500_000n;
