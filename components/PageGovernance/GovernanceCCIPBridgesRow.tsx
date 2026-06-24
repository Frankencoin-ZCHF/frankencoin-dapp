import { Address, decodeAbiParameters, formatUnits } from "viem";
import TableRow from "../Table/TableRow";
import { ADDRESS, ChainId, SupportedChain, SupportedChainsMap } from "@frankencoin/zchf";
import AppLink from "@components/AppLink";
import ChainLogo from "@components/ChainLogo";
import { ContractUrl, formatCurrency, FormatType, getChainByChainSelector, shortenAddress } from "@utils";
import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import AppButtonSecondary from "@components/AppButtonSecondary";

type RateLimiterState = {
	tokens: bigint;
	lastUpdated: number;
	isEnabled: boolean;
	capacity: bigint;
	rate: bigint;
};

const rateLimiterStateOutput = {
	type: "tuple",
	name: "",
	components: [
		{ name: "tokens", type: "uint128" },
		{ name: "lastUpdated", type: "uint32" },
		{ name: "isEnabled", type: "bool" },
		{ name: "capacity", type: "uint128" },
		{ name: "rate", type: "uint128" },
	],
} as const;

const tokenPoolReadABI = [
	{
		name: "getRemoteToken",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "chain", type: "uint64" }],
		outputs: [{ name: "", type: "bytes" }],
	},
	{
		name: "getCurrentInboundRateLimiterState",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "chain", type: "uint64" }],
		outputs: [rateLimiterStateOutput],
	},
	{
		name: "getCurrentOutboundRateLimiterState",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "chain", type: "uint64" }],
		outputs: [rateLimiterStateOutput],
	},
] as const;

const sourceTokenAddress = (chainId: ChainId): Address => {
	const addrs = ADDRESS[chainId] as Record<string, unknown>;
	return (addrs.frankencoin ?? addrs.ccipBridgedFrankencoin) as Address;
};

interface Props {
	headers: string[];
	tab: string;
	sourceChainId: ChainId;
	destinationSelector: bigint;
	inbound?: RateLimiterState | null;
	outbound?: RateLimiterState | null;
}

export default function GovernanceCCIPBridgesRow({
	headers,
	tab,
	sourceChainId,
	destinationSelector,
	inbound: inboundProp,
	outbound: outboundProp,
}: Props) {
	const [remoteToken, setRemoteToken] = useState<Address | null>(null);
	const [inboundFetched, setInboundFetched] = useState<RateLimiterState | null>(null);
	const [outboundFetched, setOutboundFetched] = useState<RateLimiterState | null>(null);

	const inbound = inboundProp !== undefined ? inboundProp : inboundFetched;
	const outbound = outboundProp !== undefined ? outboundProp : outboundFetched;

	const sourceChain = SupportedChainsMap[sourceChainId] as SupportedChain;
	const destinationChain = getChainByChainSelector(destinationSelector.toString());

	useEffect(() => {
		const fetcher = async () => {
			const pool = ADDRESS[sourceChainId].ccipTokenPool;

			const fetchInbound =
				inboundProp === undefined
					? readContract(WAGMI_CONFIG, {
							address: pool,
							chainId: sourceChainId,
							abi: tokenPoolReadABI,
							functionName: "getCurrentInboundRateLimiterState",
							args: [destinationSelector],
					  })
					: Promise.resolve(null);

			const fetchOutbound =
				outboundProp === undefined
					? readContract(WAGMI_CONFIG, {
							address: pool,
							chainId: sourceChainId,
							abi: tokenPoolReadABI,
							functionName: "getCurrentOutboundRateLimiterState",
							args: [destinationSelector],
					  })
					: Promise.resolve(null);

			const [tokenBytes, inState, outState] = await Promise.all([
				readContract(WAGMI_CONFIG, {
					address: pool,
					chainId: sourceChainId,
					abi: tokenPoolReadABI,
					functionName: "getRemoteToken",
					args: [destinationSelector],
				}),
				fetchInbound,
				fetchOutbound,
			]);

			if (tokenBytes && tokenBytes !== "0x") {
				try {
					const [addr] = decodeAbiParameters([{ type: "address" }], tokenBytes);
					setRemoteToken(addr);
				} catch {
					setRemoteToken(null);
				}
			}
			if (inState !== null) setInboundFetched(inState as RateLimiterState);
			if (outState !== null) setOutboundFetched(outState as RateLimiterState);
		};
		fetcher();
	}, [sourceChainId, destinationSelector]);

	const detailsHref = `/governance/bridges/${sourceChainId}/${destinationSelector.toString()}`;

	return (
		<TableRow
			headers={headers}
			tab={tab}
			rawHeader={true}
			actionCol={
				<AppButtonSecondary className="h-10" to={detailsHref}>
					View
				</AppButtonSecondary>
			}
		>
			{/* Configured Chain */}
			<div className="flex items-center gap-2 md:text-left max-md:justify-end">
				<ChainLogo chain={(sourceChain?.name ?? "").toLowerCase()} size={5} />
				<AppLink
					className=""
					label={sourceChain?.name ?? String(sourceChainId)}
					href={ContractUrl(sourceTokenAddress(sourceChainId), sourceChain)}
					external={true}
				/>
			</div>

			{/* Other Chain */}
			<div className="flex items-center justify-end gap-2">
				<ChainLogo chain={(destinationChain?.name ?? "").toLowerCase()} size={5} />
				{remoteToken ? (
					<AppLink
						className=""
						label={destinationChain?.name ?? destinationSelector.toString()}
						href={ContractUrl(remoteToken, destinationChain)}
						external={true}
					/>
				) : (
					<span>{destinationChain?.name ?? destinationSelector.toString()}</span>
				)}
			</div>

			{/* Outgoing Limit */}
			<div className="flex flex-col">
				<RateLimitCell state={outbound} />
			</div>

			{/* Incoming Limit */}
			<div className="flex flex-col">
				<RateLimitCell state={inbound} />
			</div>
		</TableRow>
	);
}

function RateLimitCell({ state }: { state: RateLimiterState | null }) {
	if (!state) return <>–</>;
	if (!state.isEnabled) return <>Unlimited</>;

	const capacity = formatCurrency(formatUnits(state.capacity, 18), 0, 0, FormatType.symbol);
	const available = formatCurrency(formatUnits(state.tokens, 18), 0, 0, FormatType.symbol);
	const deficit = state.capacity - state.tokens;
	const isRefueling = deficit > 0n && state.rate > 0n;
	const secondsToFull = isRefueling ? Number(deficit) / Number(state.rate) : 0;
	const hours = Math.floor(secondsToFull / 3600);
	const minutes = Math.floor((secondsToFull % 3600) / 60);
	const refuelLabel = hours > 0 ? `~${hours}h ${minutes}m until full` : minutes > 0 ? `~${minutes}m until full` : null;

	return (
		<div className="flex flex-col">
			<span>
				{isRefueling ? `${available} of` : ""} {capacity} ZCHF
			</span>
			{refuelLabel && <span className="text-xs text-text-subheader">{refuelLabel}</span>}
		</div>
	);
}
