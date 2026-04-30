import { Address, decodeAbiParameters, formatUnits } from "viem";
import TableRow from "../Table/TableRow";
import { ADDRESS, ChainId, SupportedChain, SupportedChainsMap } from "@frankencoin/zchf";
import AppLink from "@components/AppLink";
import ChainLogo from "@components/ChainLogo";
import { ContractUrl, formatCurrency, getChainByChainSelector, shortenAddress } from "@utils";
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
] as const;

interface Props {
	headers: string[];
	tab: string;
	sourceChainId: ChainId;
	destinationSelector: bigint;
	inbound?: RateLimiterState | null;
}

export default function GovernanceCCIPBridgesRow({ headers, tab, sourceChainId, destinationSelector, inbound: inboundProp }: Props) {
	const [remoteToken, setRemoteToken] = useState<Address | null>(null);
	const [inboundFetched, setInboundFetched] = useState<RateLimiterState | null>(null);

	const inbound = inboundProp !== undefined ? inboundProp : inboundFetched;

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

			const [tokenBytes, inState] = await Promise.all([
				readContract(WAGMI_CONFIG, {
					address: pool,
					chainId: sourceChainId,
					abi: tokenPoolReadABI,
					functionName: "getRemoteToken",
					args: [destinationSelector],
				}),
				fetchInbound,
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
				<span>{sourceChain?.name ?? sourceChainId}</span>
			</div>

			{/* Other Chain */}
			<div className="flex items-center justify-end gap-2">
				<ChainLogo chain={(destinationChain?.name ?? "").toLowerCase()} size={5} />
				<span>{destinationChain?.name ?? destinationSelector.toString()}</span>
			</div>

			{/* Remote Token */}
			<div className="flex flex-col">
				{remoteToken ? (
					<AppLink
						label={shortenAddress(remoteToken)}
						href={ContractUrl(remoteToken, destinationChain)}
						external={true}
						className=""
					/>
				) : (
					"–"
				)}
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

	const available = formatCurrency(formatUnits(state.tokens, 18));
	const capacity = formatCurrency(formatUnits(state.capacity, 18));
	return (
		<>
			{available} / {capacity} ZCHF
		</>
	);
}
