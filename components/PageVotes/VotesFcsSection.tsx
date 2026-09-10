import { formatUnits } from "viem";
import AppTitle from "@components/AppTitle";
import GovernanceDelegation from "@components/PageGovernance/GovernanceDelegation";
import GovernanceFcsMilestoneSteps from "@components/PageGovernance/GovernanceFcsMilestoneSteps";
import GovernanceVotersTable from "@components/PageGovernance/GovernanceVotersTable";
import { formatCurrency, formatDuration } from "@utils";
import { useFPSAverageStats } from "@hooks";

export default function VotesFcsSection() {
	const fcsStats = useFPSAverageStats("fcs");

	return (
		<>
			<AppTitle title="Frankencoin Shares">
				<div className="text-text-secondary">
					FCS (Frankencoin Share) wraps FPS 1:1 and carries its own governance power on{" "}
					<span className="font-medium text-text-primary">MinterGovernance</span>,{" "}
					<span className="font-medium text-text-primary">InterestGovernance</span>, and{" "}
					<span className="font-medium text-text-primary">CCIPGovernance</span> — separate contracts from FPS's governance, each
					exposing a fixed set of qualified-holder actions (deny an unannounced minter or position, propose a rate change, manage
					the CCIP bridge) rather than a general proposal system. Voting power is proportional to both the FCS held and its
					holding duration; the average holding duration is{" "}
					<span className="font-medium text-text-primary">{formatDuration(fcsStats.avgHoldingDuration)}</span>. Under these
					conditions, an individual FCS holder with at least{" "}
					<span className="font-medium text-text-primary">{formatCurrency(formatUnits(fcsStats.fpsForVeto, 18))} FCS</span> held
					for the average duration would reach the veto threshold of 1%.
				</div>
			</AppTitle>

			<GovernanceFcsMilestoneSteps />

			<GovernanceDelegation system="fcs" />

			<GovernanceVotersTable system="fcs" />
		</>
	);
}
