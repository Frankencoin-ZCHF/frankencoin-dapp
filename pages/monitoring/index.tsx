import Head from "next/head";
import MonitoringTable from "@components/PageMonitoring/MonitoringTable";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import ChallengesTable from "@components/PageChallenges/ChallengesTable";
import AppTitle from "@components/AppTitle";

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
				<div className="text-text-secondary">Earn a reward by challenging undercollateralized positions.</div>
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
