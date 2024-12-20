import Head from "next/head";
import GovernancePositionsTable from "@components/PageGovernance/GovernancePositionsTable";
import GovernanceMintersTable from "@components/PageGovernance/GovernanceMintersTable";
import GovernanceVotersTable from "@components/PageGovernance/GovernanceVotersTable";
import GovernanceTelegramBot from "@components/PageGovernance/GovernanceTelegramBot";
import { SOCIAL } from "@utils";
import GovernanceLeadrateTable from "@components/PageGovernance/GovernanceLeadrateTable";
import GovernanceLeadrateCurrent from "@components/PageGovernance/GovernanceLeadrateCurrent";

export default function Governance() {
	return (
		<>
			<Head>
				<title>dEURO - Governance</title>
			</Head>

			<div className="md:mt-10">
				<span className="font-bold text-xl">New Positions</span>
			</div>

			<div className="">
				Participants should carefully review newly proposed position types and deny them if they think they pose a risk to the
				stability of the dEURO. There is also a{" "}
				<a
					target="_blank"
					href={SOCIAL.Github_contract_discussion}
				>
					<span className="font-bold underline">github forum</span>
				</a>
				{" and a "}
				<a target="_blank" href={SOCIAL.Telegram}>
					<span className="font-bold underline">telegram group</span>
				</a>{" "}
				to discuss eligible collaterals and their parameters.
			</div>

			<div className="md:mt-8">
				<GovernancePositionsTable />
			</div>

			<div className="md:mt-10">
				<span className="font-bold text-xl">Base Rate</span>
			</div>

			<div className="">
				This is the base rate that is applied when minting new dEUROs and the rate at which savers continuously accrue
				interest. Anyone with veto power can propose a change, which can be applied if there is no counter-proposal within seven
				days.
			</div>

			<div className="md:mt-8">
				<GovernanceLeadrateCurrent />
			</div>

			<div className="md:mt-8">
				<GovernanceLeadrateTable />
			</div>

			<div className="md:mt-10">
				<span className="font-bold text-xl">Minting Modules</span>
			</div>

			<div className="md:mt-8">
				<GovernanceMintersTable />
			</div>

			<div className="md:mt-10">
				<span className="font-bold text-xl">Native dEURO Pool Share Holders</span>
			</div>

			<div className="md:mt-8">
				<GovernanceVotersTable />
			</div>

			<div className="md:mt-10">
				<span className="font-bold text-xl">dEURO Api Bot</span>
			</div>

			<div className="md:mt-8">
				<GovernanceTelegramBot />
			</div>
		</>
	);
}
