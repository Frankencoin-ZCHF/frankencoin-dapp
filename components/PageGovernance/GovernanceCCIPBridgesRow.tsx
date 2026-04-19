import { Address, decodeAbiParameters, formatUnits } from "viem";
import TableRow from "../Table/TableRow";
import { ADDRESS, ChainId, SupportedChain, SupportedChainsMap } from "@frankencoin/zchf";
import AppLink from "@components/AppLink";
import Button from "@components/Button";
import { ContractUrl, formatCurrency, getChainByChainSelector, shortenAddress } from "@utils";
import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { useRouter } from "next/router";

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
	sourceChainId: ChainId;
	destinationSelector: bigint;
}

export default function GovernanceCCIPBridgesRow({ headers, sourceChainId, destinationSelector }: Props) {
	const [remoteToken, setRemoteToken] = useState<Address | null>(null);
	const [inbound, setInbound] = useState<RateLimiterState | null>(null);

	const sourceChain = SupportedChainsMap[sourceChainId] as SupportedChain;
	const destinationChain = getChainByChainSelector(destinationSelector.toString());

	useEffect(() => {
		const fetcher = async () => {
			const pool = ADDRESS[sourceChainId].ccipTokenPool;

			const [tokenBytes, inState] = await Promise.all([
				readContract(WAGMI_CONFIG, {
					address: pool,
					chainId: sourceChainId,
					abi: tokenPoolReadABI,
					functionName: "getRemoteToken",
					args: [destinationSelector],
				}),
				readContract(WAGMI_CONFIG, {
					address: pool,
					chainId: sourceChainId,
					abi: tokenPoolReadABI,
					functionName: "getCurrentInboundRateLimiterState",
					args: [destinationSelector],
				}),
			]);

			if (tokenBytes && tokenBytes !== "0x") {
				try {
					const [addr] = decodeAbiParameters([{ type: "address" }], tokenBytes);
					setRemoteToken(addr);
				} catch {
					setRemoteToken(null);
				}
			}
			setInbound(inState as RateLimiterState);
		};
		fetcher();
	}, [sourceChainId, destinationSelector]);

	const router = useRouter();
	const detailsHref = `/governance/bridges/${sourceChainId}/${destinationSelector.toString()}`;

	return (
		<TableRow
			headers={headers}
			tab=""
			rawHeader={true}
			actionCol={
				<Button className="h-10" onClick={() => router.push(detailsHref)}>
					View
				</Button>
			}
		>
			{/* Configured Chain */}
			<div className="flex flex-col md:text-left max-md:text-right">{sourceChain?.name ?? sourceChainId}</div>

			{/* Other Chain */}
			<div className="flex flex-col">{destinationChain?.name ?? destinationSelector.toString()}</div>

			{/* Remote Token */}
			<div className="flex flex-col">
				{remoteToken ? (
					<AppLink label={shortenAddress(remoteToken)} href={ContractUrl(remoteToken, destinationChain)} external={true} className="" />
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
