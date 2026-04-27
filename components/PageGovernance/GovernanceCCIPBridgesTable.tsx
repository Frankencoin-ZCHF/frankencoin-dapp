import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableHeader from "../Table/TableHead";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useEffect, useMemo, useState } from "react";
import { readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, ChainId, SupportedChainIds, SupportedChainsMap } from "@frankencoin/zchf";
import GovernanceCCIPBridgesRow from "./GovernanceCCIPBridgesRow";
import { mainnet } from "viem/chains";
import { getChainByChainSelector } from "@utils";
import ChainBySelect from "@components/Input/ChainBySelect";

type RateLimiterState = {
	tokens: bigint;
	lastUpdated: number;
	isEnabled: boolean;
	capacity: bigint;
	rate: bigint;
};

const tokenPoolReadABI = [
	{
		name: "getSupportedChains",
		type: "function",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "", type: "uint64[]" }],
	},
	{
		name: "getCurrentInboundRateLimiterState",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "chain", type: "uint64" }],
		outputs: [
			{
				type: "tuple",
				name: "",
				components: [
					{ name: "tokens", type: "uint128" },
					{ name: "lastUpdated", type: "uint32" },
					{ name: "isEnabled", type: "bool" },
					{ name: "capacity", type: "uint128" },
					{ name: "rate", type: "uint128" },
				],
			},
		],
	},
] as const;

type BridgePair = { sourceChainId: ChainId; destinationSelector: bigint; inbound: RateLimiterState | null };

const DEFAULT_SOURCE = SupportedChainsMap[mainnet.id].name;

export default function GovernanceCCIPBridgesTable() {
	const headers: string[] = ["Configured Chain", "Other Chain", "Remote Token", "Incoming Limit"];
	const [pairs, setPairs] = useState<BridgePair[]>([]);
	const [loaded, setLoaded] = useState<boolean>(false);

	const [sourceFilter, setSourceFilter] = useState<string | null>(DEFAULT_SOURCE);
	const [destinationFilter, setDestinationFilter] = useState<string | null>(null);

	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const handleTabOnChange = (e: string) => {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			setReverse(false);
			setTab(e);
		}
	};

	useEffect(() => {
		const fetcher = async () => {
			const results = await Promise.allSettled(
				SupportedChainIds.map(async (chainId) => {
					const pool = ADDRESS[chainId].ccipTokenPool;
					const selectors = await readContract(WAGMI_CONFIG, {
						address: pool,
						chainId,
						abi: tokenPoolReadABI,
						functionName: "getSupportedChains",
					});
					return { chainId, selectors };
				})
			);

			const pairs: BridgePair[] = [];
			for (const r of results) {
				if (r.status !== "fulfilled") continue;
				for (const selector of r.value.selectors) {
					pairs.push({ sourceChainId: r.value.chainId, destinationSelector: selector, inbound: null });
				}
			}

			// Fetch inbound rate limiter state for all pairs in parallel
			await Promise.allSettled(
				pairs.map(async (p, i) => {
					try {
						const state = await readContract(WAGMI_CONFIG, {
							address: ADDRESS[p.sourceChainId].ccipTokenPool,
							chainId: p.sourceChainId,
							abi: tokenPoolReadABI,
							functionName: "getCurrentInboundRateLimiterState",
							args: [p.destinationSelector],
						});
						pairs[i] = { ...p, inbound: state as RateLimiterState };
					} catch {
						// leave inbound: null
					}
				})
			);

			setPairs(pairs);
			setLoaded(true);
		};
		fetcher();
	}, []);

	const sourceChainNames = useMemo(() => SupportedChainIds.map((id) => SupportedChainsMap[id].name), []);
	const destinationChainNames = useMemo(() => {
		const names = new Set<string>();
		for (const p of pairs) {
			const name = getChainByChainSelector(p.destinationSelector.toString())?.name;
			if (name) names.add(name);
		}
		return Array.from(names);
	}, [pairs]);

	const filteredPairs = pairs
		.filter((p) => {
			if (sourceFilter && SupportedChainsMap[p.sourceChainId]?.name !== sourceFilter) return false;
			if (destinationFilter) {
				const destName = getChainByChainSelector(p.destinationSelector.toString())?.name;
				if (destName !== destinationFilter) return false;
			}
			return true;
		})
		.sort((a, b) => {
			let cmp = 0;
			if (tab === headers[0]) {
				cmp = (SupportedChainsMap[a.sourceChainId]?.name ?? "").localeCompare(SupportedChainsMap[b.sourceChainId]?.name ?? "");
			} else if (tab === headers[1]) {
				const nameA = getChainByChainSelector(a.destinationSelector.toString())?.name ?? "";
				const nameB = getChainByChainSelector(b.destinationSelector.toString())?.name ?? "";
				cmp = nameA.localeCompare(nameB);
			} else if (tab === headers[3]) {
				const capA = a.inbound?.isEnabled ? a.inbound.capacity : a.inbound ? BigInt(Number.MAX_SAFE_INTEGER) : -1n;
				const capB = b.inbound?.isEnabled ? b.inbound.capacity : b.inbound ? BigInt(Number.MAX_SAFE_INTEGER) : -1n;
				cmp = capA < capB ? -1 : capA > capB ? 1 : 0;
			}
			return reverse ? -cmp : cmp;
		});

	return (
		<Table>
			<div className="rounded-t-lg bg-table-header-primary">
				<div className="flex flex-wrap items-center gap-2 px-8 xl:px-12 py-3 border-b border-table-header-secondary">
					<div className="flex flex-col md:flex-row md:items-center md:justify-end w-full max-md:gap-2 md:gap-10">
						<div className="flex items-center justify-between md:justify-start gap-2">
							<span className="text-sm font-semibold text-text-secondary">From</span>
							<ChainBySelect
								chains={sourceChainNames}
								chain={sourceFilter ?? ""}
								chainOnChange={setSourceFilter}
								isClearable
							/>
						</div>

						{/* Divider between search and controls — mobile only */}
						<div className="md:hidden border-t border-gray-100 -mx-7" />

						<div className="flex items-center justify-between md:justify-start gap-2">
							<span className="text-sm font-semibold text-text-secondary">To</span>
							<ChainBySelect
								chains={destinationChainNames}
								chain={destinationFilter ?? ""}
								chainOnChange={setDestinationFilter}
								isClearable
							/>
						</div>
					</div>
				</div>
				<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol />
			</div>
			<TableBody>
				{filteredPairs.length === 0 ? (
					<TableRowEmpty>{loaded ? "No bridges match the selected filters." : "Loading bridges..."}</TableRowEmpty>
				) : (
					filteredPairs.map((p) => (
						<GovernanceCCIPBridgesRow
							key={`${p.sourceChainId}-${p.destinationSelector.toString()}`}
							headers={headers}
							tab={tab}
							sourceChainId={p.sourceChainId}
							destinationSelector={p.destinationSelector}
							inbound={p.inbound}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
}
