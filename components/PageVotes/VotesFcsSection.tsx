import { useConnection } from "wagmi";
import { formatUnits } from "viem";
import { mainnet } from "viem/chains";
import { ADDRESS } from "@frankencoin/zchf";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import GovernanceDelegation from "@components/PageGovernance/GovernanceDelegation";
import GovernanceFcsMilestoneSteps from "@components/PageGovernance/GovernanceFcsMilestoneSteps";
import GovernanceVotersTable from "@components/PageGovernance/GovernanceVotersTable";
import GovernanceFcsFpsVotesTable from "@components/PageGovernance/GovernanceFcsFpsVotesTable";
import { ContractUrl, formatCurrency, formatDuration } from "@utils";
import { useFPSAverageStats } from "@hooks";

export default function VotesFcsSection() {
	const fcsStats = useFPSAverageStats("fcs");
	const { address } = useConnection();

	return (
		<>
			<AppTitle title="Frankencoin Shares">
				<div className="text-text-secondary">
					<AppLink className="inline" label="FCS (Frankencoin Share)" href={ContractUrl(ADDRESS[mainnet.id].fcs)} external={true} />{" "}
					wraps FPS 1:1 and carries its own governance power on{" "}
					<span className="font-medium text-text-primary">MinterGovernance</span>,{" "}
					<span className="font-medium text-text-primary">InterestGovernance</span>, and{" "}
					<span className="font-medium text-text-primary">CCIPGovernance</span> — separate contracts from FPS's governance, each
					exposing a fixed set of qualified-holder actions (deny an unannounced minter or position, propose a rate change, manage
					the CCIP bridge) rather than a general proposal system. Voting power is proportional to both the FCS held and its
					holding duration; the average holding duration is{" "}
					<span className="font-medium text-text-primary">{formatDuration(fcsStats.avgHoldingDuration)}</span>. Under these
					conditions, an individual FCS holder with at least{" "}
					<span className="font-medium text-text-primary">{formatCurrency(formatUnits(fcsStats.fpsForVeto, 18))} FCS</span> held
					for the average duration would reach the veto threshold of 1%. If you need voting power on one of the supported multichains, sync your
					votes first. You can track cross-chain transfers on the{" "}
					<AppLink
						className=""
						label="CCIP Explorer"
						external={true}
						href={`https://ccip.chain.link${address ? `/address/${address}` : ""}`}
					/>
					.
				</div>
			</AppTitle>

			<GovernanceFcsMilestoneSteps />

			<AppTitle title="FCS Veto Power per Chain">
				<div className="text-text-secondary">
					FCS can only veto on a chain once the FPS votes held by the FCS contract, as last synced from mainnet, exceed 2% of that
					chain&apos;s FPS votes. Votes grow with holding time, so synced values go stale. Anyone can sync them.
				</div>
			</AppTitle>

			<GovernanceFcsFpsVotesTable />

			<GovernanceDelegation system="fcs" />

			<GovernanceVotersTable system="fcs" />
		</>
	);
}
