import Head from "next/head";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchChallengesList } from "../../redux/slices/challenges.slice";
import { fetchBidsList } from "../../redux/slices/bids.slice";
import AppTitle from "@components/AppTitle";
import MonitoringAllChallengesTable from "@components/PageMonitoringChallenges/MonitoringAllChallengesTable";

export default function PageChallengesOverview() {
	useEffect(() => {
		store.dispatch(fetchChallengesList());
		store.dispatch(fetchBidsList());
	}, []);

	return (
		<>
			<Head>
				<title>Frankencoin - Challenges Overview</title>
			</Head>

			<AppTitle title="Challenges & Bids">
				<div className="text-text-secondary">
					A complete overview of all challenges that have occurred, both successful and unsuccessful, along with their bids. This
					track record helps market participants assess the protocol&apos;s history and resilience.
				</div>
			</AppTitle>

			<div className="md:mt-8">
				<MonitoringAllChallengesTable />
			</div>
		</>
	);
}
