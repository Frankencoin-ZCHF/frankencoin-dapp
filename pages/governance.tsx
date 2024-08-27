import Head from "next/head";
import MypositionsTable from "@components/PageMypositions/MypositionsTable";
import MyPositionsChallengesTable from "@components/PageMypositions/MyPositionsChallengesTable";
import MyPositionsBidsTable from "@components/PageMypositions/MyPositionsBidsTable";
import { useRouter } from "next/router";
import { Address } from "viem";
import { shortenAddress } from "@utils";
import GovernancePositionsTable from "@components/PageGovernance/GovernancePositionsTable";
import GovernanceMintersTable from "@components/PageGovernance/GovernanceMintersTable";
import GovernanceVotersTable from "@components/PageGovernance/GovernanceVotersTable";

export default function Governance() {
	return (
		<>
			<Head>
				<title>Frankencoin - Positions</title>
			</Head>

			{/* Positions Proposals */}
			<div className="md:mt-8">
				<span className="font-bold text-xl">Positions Proposals </span>
			</div>

			<div className="md:mt-8">
				<GovernancePositionsTable />
			</div>

			{/* Minters Proposals */}
			<div className="md:mt-10">
				<span className="font-bold text-xl">Minters Proposals</span>
			</div>

			<div className="md:mt-8">
				<GovernanceMintersTable />
			</div>

			{/* Top Voters */}
			<div className="md:mt-10">
				<span className="font-bold text-xl">Top Voters</span>
			</div>

			<div className="md:mt-8">
				<GovernanceVotersTable />
			</div>
		</>
	);
}

function DisplayWarningMessage(props: { overwrite: Address }) {
	return (
		<div>
			<span className="font-bold text-sm">{props.overwrite ? `(Public View for: ${shortenAddress(props.overwrite)})` : ""}</span>
		</div>
	);
}
