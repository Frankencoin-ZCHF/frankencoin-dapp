import Head from "next/head";
import MypositionsTable from "@components/PageMypositions/MypositionsTable";
import MyPositionsChallengesTable from "@components/PageMypositions/MyPositionsChallengesTable";
import MyPositionsBidsTable from "@components/PageMypositions/MyPositionsBidsTable";
import { useRouter } from "next/router";
import { Address } from "viem";
import { shortenAddress } from "@utils";
import GovernancePositionsTable from "@components/PageGovernance/GovernancePositionsTable";
import GovernanceMintersTable from "@components/PageGovernance/GovernanceMintersTable";

export default function Governance() {
	const router = useRouter();
	const overwrite: Address = router.query.address as Address;

	return (
		<>
			<Head>
				<title>Frankencoin - Positions</title>
			</Head>

			{/* Positions Proposal */}
			<div className="md:mt-8">
				<span className="font-bold text-xl">Positions Proposals </span>
				<DisplayWarningMessage overwrite={overwrite} />
			</div>

			<div className="md:mt-8">
				<GovernancePositionsTable />
			</div>

			{/* Section Challenges */}
			<div className="md:mt-10">
				<span className="font-bold text-xl">Minters Proposals</span>
				<DisplayWarningMessage overwrite={overwrite} />
			</div>

			<div className="md:mt-8">
				<GovernanceMintersTable />
			</div>

			{/* Section Bids
			<div className="md:mt-10">
				<span className="font-bold text-xl">Top Voters</span>
				<DisplayWarningMessage overwrite={overwrite} />
			</div>

			<div className="md:mt-8">
				<MyPositionsBidsTable />
			</div> */}
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
