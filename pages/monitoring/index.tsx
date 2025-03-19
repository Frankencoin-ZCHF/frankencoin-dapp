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

			<AppTitle title="Auctions">
				<div className="text-text-secondary">
					Track live challenges through Dutch auctions of Frankencoin minting positions. Monitor bidding activities, auction
					phases and engage in decentralized price discovery - either by challenging positions or placing strategic bids on
					existing auctions.
				</div>
			</AppTitle>

			<div className="md:mt-8">
				<ChallengesTable />
			</div>

			<AppTitle title="Positions">
				<div className="text-text-secondary">
					Explore active Frankencoin minting positions with detailed insights into expiration dates and collateral status. Take
					action across different position versions - all are challengeable, and version two introduces the ability to force-sell
					expired positions for enhanced market stability and fair price discovery.
				</div>
			</AppTitle>

			<div className="md:mt-8">
				<MonitoringTable />
			</div>
		</>
	);
}
