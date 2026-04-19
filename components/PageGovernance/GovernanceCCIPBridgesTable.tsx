import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useEffect, useMemo, useRef, useState } from "react";
import { readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, ChainId, SupportedChainIds, SupportedChainsMap } from "@frankencoin/zchf";
import GovernanceCCIPBridgesRow from "./GovernanceCCIPBridgesRow";
import { mainnet } from "viem/chains";
import { getChainByChainSelector } from "@utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import ChainLogo from "@components/ChainLogo";

const tokenPoolReadABI = [
	{
		name: "getSupportedChains",
		type: "function",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "", type: "uint64[]" }],
	},
] as const;

type BridgePair = { sourceChainId: ChainId; destinationSelector: bigint };

const ANY = "Any";
const DEFAULT_SOURCE = SupportedChainsMap[mainnet.id].name;

export default function GovernanceCCIPBridgesTable() {
	const headers: string[] = ["Configured Chain", "Other Chain", "Remote Token", "Incoming Limit"];
	const [pairs, setPairs] = useState<BridgePair[]>([]);
	const [loaded, setLoaded] = useState<boolean>(false);

	const [sourceFilter, setSourceFilter] = useState<string>(DEFAULT_SOURCE);
	const [destinationFilter, setDestinationFilter] = useState<string>(ANY);

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

			const collected: BridgePair[] = [];
			for (const r of results) {
				if (r.status !== "fulfilled") continue;
				for (const selector of r.value.selectors) {
					collected.push({ sourceChainId: r.value.chainId, destinationSelector: selector });
				}
			}
			setPairs(collected);
			setLoaded(true);
		};
		fetcher();
	}, []);

	const sourceChainNames = useMemo(() => [ANY, ...SupportedChainIds.map((id) => SupportedChainsMap[id].name)], []);
	const destinationChainNames = useMemo(() => {
		const names = new Set<string>();
		for (const p of pairs) {
			const name = getChainByChainSelector(p.destinationSelector.toString())?.name;
			if (name) names.add(name);
		}
		return [ANY, ...Array.from(names)];
	}, [pairs]);

	const filteredPairs = pairs.filter((p) => {
		if (sourceFilter !== ANY && SupportedChainsMap[p.sourceChainId]?.name !== sourceFilter) return false;
		if (destinationFilter !== ANY) {
			const destName = getChainByChainSelector(p.destinationSelector.toString())?.name;
			if (destName !== destinationFilter) return false;
		}
		return true;
	});

	return (
		<Table>
			<div className="items-center justify-between rounded-t-lg bg-table-header-primary py-5 px-8 md:flex xl:px-12">
				{/* Desktop header */}
				<div className={`max-md:hidden pl-8 flex-grow grid-cols-2 md:grid md:grid-cols-${headers.length}`}>
					<div className="flex items-center gap-2">
						<span className="font-bold text-text-header">{headers[0]}</span>
						<ColumnFilter value={sourceFilter} options={sourceChainNames} onChange={setSourceFilter} align="left" />
					</div>
					<div className="flex items-center gap-2 justify-end">
						<span className="font-bold text-text-header">{headers[1]}</span>
						<ColumnFilter value={destinationFilter} options={destinationChainNames} onChange={setDestinationFilter} align="right" />
					</div>
					{headers.slice(2).map((h, i) => (
						<div key={`th-${i + 2}`} className="text-right">
							<span className="font-bold text-text-header">{h}</span>
						</div>
					))}
				</div>
				<div className="max-md:hidden">
					<div className="text-text-header font-bold text-right w-40 flex-shrink-0">Action</div>
				</div>

				{/* Mobile header */}
				<div className="md:hidden flex flex-col gap-3">
					<div className="flex items-center">
						<div className="flex-1 font-semibold text-text-secondary">{headers[0]}</div>
						<ColumnFilter value={sourceFilter} options={sourceChainNames} onChange={setSourceFilter} align="right" />
					</div>
					<div className="flex items-center">
						<div className="flex-1 font-semibold text-text-secondary">{headers[1]}</div>
						<ColumnFilter value={destinationFilter} options={destinationChainNames} onChange={setDestinationFilter} align="right" />
					</div>
				</div>
			</div>

			<TableBody>
				{filteredPairs.length === 0 ? (
					<TableRowEmpty>{loaded ? "No bridges match the selected filters." : "Loading bridges..."}</TableRowEmpty>
				) : (
					filteredPairs.map((p) => (
						<GovernanceCCIPBridgesRow
							key={`${p.sourceChainId}-${p.destinationSelector.toString()}`}
							headers={headers}
							sourceChainId={p.sourceChainId}
							destinationSelector={p.destinationSelector}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
}

interface ColumnFilterProps {
	value: string;
	options: string[];
	onChange: (value: string) => void;
	align: "left" | "right";
}

function ColumnFilter({ value, options, onChange, align }: ColumnFilterProps) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const active = value !== ANY;

	return (
		<div className="relative inline-block" ref={ref}>
			<button
				onClick={() => setOpen((o) => !o)}
				className={`w-6 h-6 flex items-center justify-center rounded hover:bg-table-row-hover ${
					active ? "text-text-active" : "text-text-header"
				}`}
				aria-label="Filter"
			>
				<FontAwesomeIcon icon={faFilter} className="w-3.5 h-3.5" />
			</button>

			{open && (
				<div
					className={`absolute top-full mt-2 z-50 w-48 rounded-lg bg-white shadow-lg border border-gray-200 py-2 ${
						align === "right" ? "right-0" : "left-0"
					}`}
				>
					{options.map((o) => {
						const selected = value === o;
						return (
							<button
								key={o}
								onClick={() => {
									onChange(o);
									setOpen(false);
								}}
								className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 ${
									selected ? "font-semibold" : ""
								}`}
							>
								<div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
									{o !== ANY ? <ChainLogo chain={o.toLowerCase()} size={5} /> : null}
								</div>
								<span className="text-sm text-text-primary">{o}</span>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
