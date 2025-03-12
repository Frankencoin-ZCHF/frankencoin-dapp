import Head from "next/head";
import GovernancePositionsTable from "@components/PageGovernance/GovernancePositionsTable";
import GovernanceMintersTable from "@components/PageGovernance/GovernanceMintersTable";
import GovernanceVotersTable from "@components/PageGovernance/GovernanceVotersTable";
import GovernanceTelegramBot from "@components/PageGovernance/GovernanceTelegramBot";
import { SOCIAL } from "@utils";
import GovernanceLeadrateTable from "@components/PageGovernance/GovernanceLeadrateTable";
import GovernanceLeadrateCurrent from "@components/PageGovernance/GovernanceLeadrateCurrent";
import AppTitle from "@components/AppTitle";

export default function Governance() {
	return (
		<>
			<Head>
				<title>Frankencoin - Governance</title>
			</Head>

			<AppTitle title="New Positions">
				<div className="text-text-secondary">
					Participants should carefully review newly proposed position types and deny them if they think they pose a risk to the
					stability of the Frankencoin. There is also a{" "}
					<a
						target="_blank"
						href="https://github.com/Frankencoin-ZCHF/FrankenCoin/discussions/categories/acceptable-collaterals?discussions_q=is%3Aopen+category%3A%22Acceptable+Collaterals%22"
					>
						<span className="font-bold underline">github forum</span>
					</a>
					{" and a "}
					<a target="_blank" href={SOCIAL.Telegram}>
						<span className="font-bold underline">telegram group</span>
					</a>{" "}
					to discuss eligible collaterals and their parameters.
				</div>
			</AppTitle>

			<GovernancePositionsTable />

			<AppTitle title="Base Rate Proposals">
				<div className="text-text-secondary">
					This is the base rate that is applied when minting new Frankencoins and the rate at which savers continuously accrue
					interest. Anyone with veto power can propose a change, which can be applied if there is no counter-proposal within seven
					days.
				</div>
			</AppTitle>

			<GovernanceLeadrateCurrent />

			<GovernanceLeadrateTable />

			<AppTitle title="Minting Modules" />

			<GovernanceMintersTable />

			<AppTitle title="Frankencoin Pool Share Holders" />

			<GovernanceVotersTable />

			<AppTitle title="Frankencoin Api Bot" />

			<GovernanceTelegramBot />
		</>
	);
}
