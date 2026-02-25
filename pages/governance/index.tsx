import Head from "next/head";
import GovernancePositionsTable from "@components/PageGovernance/GovernancePositionsTable";
import GovernanceMintersTable from "@components/PageGovernance/GovernanceMintersTable";
import GovernanceVotersTable from "@components/PageGovernance/GovernanceVotersTable";
import GovernanceTelegramBot from "@components/PageGovernance/GovernanceTelegramBot";
import { formatCurrency, formatDuration, SOCIAL } from "@utils";
import GovernanceLeadrateTable from "@components/PageGovernance/GovernanceLeadrateTable";
import GovernanceLeadrateCurrent from "@components/PageGovernance/GovernanceLeadrateCurrent";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchLeadrate } from "../../redux/slices/savings.slice";
import GovernanceMintersPropose from "@components/PageGovernance/GovernanceMintersPropose";
import { useHoldingDurationStats } from "@hooks";
import { formatUnits } from "viem";

export default function Governance() {
	const stats = useHoldingDurationStats();

	useEffect(() => {
		store.dispatch(fetchLeadrate());
	}, []);

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

			<GovernanceMintersTable length={3} />

			<div className="flex justify-left">
				<AppLink className="text-left" label="See all modules" href="/governance/modules" external={false} />
			</div>

			<AppTitle title="Frankencoin Pool Share Holders">
				<div className="text-text-secondary">
					Voting power is proportional to both the number of FPS held as the holding duration. The average holding duration is{" "}
					<span className="font-medium text-text-primary">{formatDuration(stats.avgHoldingDuration)}</span>. Under these
					conditions, an individual FPS holder with at least{" "}
					<span className="font-medium text-text-primary">{formatCurrency(formatUnits(stats.fpsForVeto, 18))} FPS</span> held for
					the average duration would reach the veto threshold.
				</div>
			</AppTitle>

			<GovernanceVotersTable />

			<AppTitle title="Frankencoin Api Bot" />

			<GovernanceTelegramBot />
		</>
	);
}
