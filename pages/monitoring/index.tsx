import Head from "next/head";
import MonitoringTable from "@components/PageMonitoring/MonitoringTable";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import ChallengesTable from "@components/PageChallenges/ChallengesTable";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";

export default function Positions() {
	useEffect(() => {
		store.dispatch(fetchPositionsList());
	}, []);

	return (
		<>
			<Head>
				<title>Frankencoin - Monitoring</title>
			</Head>

			<AppTitle title="Positions">
				<div className="text-text-secondary">
					Discover rewards by engaging with undercollateralized positions. Here, you will find a comprehensive overview of the{" "}
					<AppLink label="ecosystem" href="/monitoring/ecosystem" external={false} className="" /> or discover the{" "}
					<AppLink className="" label="transaction logs." href={"/monitoring/logs"} external={false} />
				</div>
			</AppTitle>
			<div className="md:mt-8">
				<MonitoringTable />
			</div>

			<AppTitle title="Auctions">
				<div className="text-text-secondary">Buy collateral of challenged or expired positions in a Dutch auction.</div>
			</AppTitle>
			<div className="md:mt-8">
				<ChallengesTable />
			</div>
		</>
	);
}
