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
				</a>
				{" or "}
				<a target="_blank" href={SOCIAL.Telegram}>
					<span className="font-bold underline">telegram group</span>
				</a>{" "}
				to discuss eligible collaterals and their parameters.
			</div>

			<div className="md:mt-8">
				<GovernancePositionsTable />
			</div>

			<div className="md:mt-10">
				<span className="font-bold text-xl">Leadrate Proposals</span>
			</div>

			<div className="">
				Qualified FPS holders can propose changes to the leadrate, which determines the base interest rate for all Frankencoin
				positions. After a proposal period of 7 days, the change can be applied and affects the entire systems stability and growth.
				Join the discussion in the{" "}
				<a target="_blank" href="https://github.com/Frankencoin-ZCHF/FrankenCoin/discussions">
					<span className="font-bold underline">github forum</span>
				</a>
				{" or "}
				<a target="_blank" href={SOCIAL.Telegram}>
					<span className="font-bold underline">telegram group</span>
				</a>{" "}
				to evaluate and debate proposed lead rate adjustments.
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
