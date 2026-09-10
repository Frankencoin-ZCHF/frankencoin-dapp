import { useConnection } from "wagmi";
import { formatUnits } from "viem";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import GovernanceDelegation from "@components/PageGovernance/GovernanceDelegation";
import GovernanceVotersTable from "@components/PageGovernance/GovernanceVotersTable";
import { formatCurrency, formatDuration } from "@utils";
import { useFPSAverageStats } from "@hooks";

export default function VotesFpsSection() {
	const fpsStats = useFPSAverageStats("fps");
	const { address } = useConnection();

	return (
		<>
			<AppTitle title="Frankencoin Pool Shares">
				<div className="text-text-secondary">
					FPS (Frankencoin Pool Share) is the governance token of the Frankencoin Ecosystem. Voting power is proportional to both
					the number of FPS held and the holding duration. The average holding duration is{" "}
					<span className="font-medium text-text-primary">{formatDuration(fpsStats.avgHoldingDuration)}</span>. Under these
					conditions, an individual FPS holder with at least{" "}
					<span className="font-medium text-text-primary">{formatCurrency(formatUnits(fpsStats.fpsForVeto, 18))} FPS</span> held
					for the average duration would reach the veto threshold of 2%. If you need voting power on one of the supported
					multichains, sync your votes first. You can track cross-chain transfers on the{" "}
					<AppLink
						className=""
						label="CCIP Explorer"
						external={true}
						href={`https://ccip.chain.link${address ? `/address/${address}` : ""}`}
					/>
					.
				</div>
			</AppTitle>

			<GovernanceDelegation system="fps" />

			<GovernanceVotersTable system="fps" />
		</>
	);
}
