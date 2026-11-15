import { useReadContracts } from "wagmi";
import { mainnet } from "viem/chains";
import { ADDRESS, BridgedGovernanceABI, ChainIdSide, EquityABI, SupportedChainIds, SupportedChainsMap } from "@frankencoin/zchf";
import Table from "../Table";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import TableRow from "../Table/TableRow";
import ChainLogo from "@components/ChainLogo";
import GovernanceSyncAction from "./GovernanceSyncAction";
import { QUORUM_RATIO } from "@hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt } from "@fortawesome/free-solid-svg-icons";
import { formatCurrency } from "@utils";

const SIDE_CHAIN_IDS = SupportedChainIds.filter((id) => id !== mainnet.id) as ChainIdSide[];
const FCS = ADDRESS[mainnet.id].fcs;

// The share of all FPS votes that the FCS contract holds, per chain. A chain only recognises FCS veto power
// (e.g. MinterGovernance.denyMinter) once this share, as last synced from mainnet, is above the FPS quorum.
export default function GovernanceFcsFpsVotesTable() {
	const headers: string[] = ["Chain", "FCS Share of FPS Votes"];

	const { data } = useReadContracts({
		contracts: [
			{ address: ADDRESS[mainnet.id].equity, chainId: mainnet.id, abi: EquityABI, functionName: "relativeVotes", args: [FCS] },
			...SIDE_CHAIN_IDS.flatMap((id) => [
				{
					address: ADDRESS[id].ccipBridgedGovernance,
					chainId: id,
					abi: BridgedGovernanceABI,
					functionName: "votes",
					args: [FCS],
				},
				{ address: ADDRESS[id].ccipBridgedGovernance, chainId: id, abi: BridgedGovernanceABI, functionName: "totalVotes" },
			]),
		] as any,
	});

	// ratios as plain numbers (0..1), undefined while loading or on a failed read
	const ratios: (number | undefined)[] = [
		data?.[0]?.status === "success" ? Number(data[0].result as bigint) / 1e18 : undefined,
		...SIDE_CHAIN_IDS.map((_, i) => {
			const votes = data?.[1 + i * 2];
			const total = data?.[2 + i * 2];
			if (votes?.status !== "success" || total?.status !== "success" || (total.result as bigint) === 0n) return undefined;
			return Number(votes.result as bigint) / Number(total.result as bigint);
		}),
	];

	const rows = [mainnet.id, ...SIDE_CHAIN_IDS];

	return (
		<Table>
			<TableHeader headers={headers} actionCol={true} />
			<TableBody>
				{rows.map((id, i) => {
					const name = SupportedChainsMap[id as keyof typeof SupportedChainsMap].name;
					const ratio = ratios[i];
					const hasVeto = ratio !== undefined && ratio >= QUORUM_RATIO.fps;
					return (
						<TableRow
							key={id}
							headers={headers}
							tab=""
							colSpan={2}
							paddingY="py-0.5"
							actionCol={
								id === mainnet.id ? (
									<div className="h-7" />
								) : (
									<GovernanceSyncAction targetChainId={id} voters={[FCS]} label="Sync" compact secondary />
								)
							}
						>
							<div className="flex items-center gap-2">
								<ChainLogo chain={name} size={5} />
								<span className="text-text-primary">{name}</span>
							</div>
							<div className="inline-flex items-center justify-end gap-1.5">
								{hasVeto && (
									<span title={`Veto power (at least ${QUORUM_RATIO.fps * 100}% of FPS votes)`}>
										<FontAwesomeIcon icon={faBolt} className="text-text-active" />
									</span>
								)}
								{ratio === undefined ? "—" : `${formatCurrency(ratio * 100, 2, 4)}%`}
							</div>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
