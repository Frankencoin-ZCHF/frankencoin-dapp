import Head from "next/head";
import GovernancePositionsTable from "@components/PageGovernance/GovernancePositionsTable";
import GovernanceMintersTable from "@components/PageGovernance/GovernanceMintersTable";
import GovernanceVotersTable from "@components/PageGovernance/GovernanceVotersTable";
import GovernanceTelegramBot from "@components/PageGovernance/GovernanceTelegramBot";
import { SOCIAL } from "@utils";
import GovernanceLeadrateTable from "@components/PageGovernance/GovernanceLeadrateTable";
import GovernanceLeadrateCurrent from "@components/PageGovernance/GovernanceLeadrateCurrent";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import { useEffect } from "react";
import { store } from "../redux/redux.store";
import { fetchSavings } from "../redux/slices/savings.slice";
import { useAccount } from "wagmi";
import GovernanceMintersPropose from "@components/PageGovernance/GovernanceMintersPropose";

export default function Governance() {
	const { address } = useAccount();

	useEffect(() => {
		store.dispatch(fetchSavings(address));
	}, [address]);

	return (
		<>
			<Head>
				<title>Frankencoin - Governance</title>
			</Head>

			<AppTitle title="New Positions">
				<div className="text-text-secondary">
					Participants should carefully review newly proposed position types and deny them if they think they pose a risk to the
					stability of the Frankencoin. There is also a{" "}
					<AppLink
						label={"github forum"}
						href="https://github.com/Frankencoin-ZCHF/FrankenCoin/discussions/categories/acceptable-collaterals?discussions_q=is%3Aopen+category%3A%22Acceptable+Collaterals%22"
						external={true}
						className="pr-2"
					/>
					{"and a "}
					<AppLink label={"telegram group"} href={SOCIAL.Telegram} external={true} className="pr-2" />
					to discuss eligible collaterals and their parameters.
				</div>
			</AppTitle>

			<GovernancePositionsTable />

			<AppTitle title="Interest Rates">
				<div className="text-text-secondary">
					Frankencoin has two key rates: the mint rate, applied when new coins are created, and the save rate, earned by savers on
					deposits. Anyone with veto power can propose a change, which can be applied if there is no counter-proposal within seven
					days.
				</div>
			</AppTitle>

			<GovernanceLeadrateCurrent />

			<GovernanceLeadrateTable />

			<AppTitle title="Minting Modules" />

			<GovernanceMintersPropose />

			<GovernanceMintersTable />

			<AppTitle title="Frankencoin Pool Share Holders" />

			<GovernanceVotersTable />

			<AppTitle title="Frankencoin Api Bot" />

			<GovernanceTelegramBot />
		</>
	);
}
