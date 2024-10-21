import Head from "next/head";
import GovernancePositionsTable from "@components/PageGovernance/GovernancePositionsTable";
import GovernanceMintersTable from "@components/PageGovernance/GovernanceMintersTable";
import GovernanceVotersTable from "@components/PageGovernance/GovernanceVotersTable";
import GovernanceTelegramBot from "@components/PageGovernance/GovernanceTelegramBot";

export default function Governance() {
	return (
		<>
			<Head>
				<title>Frankencoin - Governance</title>
			</Head>

			<div className="md:mt-10">
				<span className="font-bold text-xl">New Positions</span>
			</div>

			<div className="">
				Participants should carefully review newly proposed position types and deny them if they think they pose a risk to the
				stability of the Frankencoin. There also is a{" "}
				<a
					target="_blank"
					href="https://github.com/Frankencoin-ZCHF/FrankenCoin/discussions/categories/acceptable-collaterals?discussions_q=is%3Aopen+category%3A%22Acceptable+Collaterals%22"
				>
					<span className="font-bold underline">github forum</span>
				</a>{" "}
				to discuss eligible collaterals and their parameters.
			</div>

			<div className="md:mt-8">
				<GovernancePositionsTable />
			</div>

			<div className="md:mt-10">
				<span className="font-bold text-xl">Minting Modules</span>
			</div>

			<div className="md:mt-8">
				<GovernanceMintersTable />
			</div>

			<div className="md:mt-10">
				<span className="font-bold text-xl">Frankencoin Pool Share Holders</span>
			</div>

			<div className="md:mt-8">
				<GovernanceVotersTable />
			</div>

			<div className="md:mt-10">
				<span className="font-bold text-xl">Frankencoin Api Bot</span>
			</div>

			<div className="md:mt-8">
				<GovernanceTelegramBot />
			</div>
		</>
	);
}
