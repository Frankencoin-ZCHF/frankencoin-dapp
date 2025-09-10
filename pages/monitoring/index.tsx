import Head from "next/head";
import MonitoringTable from "@components/PageMonitoring/MonitoringTable";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import { fetchMarketChart } from "../../redux/slices/prices.slice";
import ChallengesTable from "@components/PageChallenges/ChallengesTable";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import MarketChart from "@components/PageEcoSystem/MarketChart";

export default function Positions() {
	useEffect(() => {
		store.dispatch(fetchPositionsList());
		store.dispatch(fetchMarketChart());
	}, []);

	return (
		<>
			<Head>
				<title>Frankencoin - Monitoring</title>
			</Head>

			<AppTitle title="Markets Metrics">
				<div className="text-text-secondary">
					Discover markets and arbitrage opportunities. Data provided by{" "}
					<AppLink className="" label="Coingecko" href={"https://www.coingecko.com/en/coins/frankencoin"} external={true} />
				</div>
			</AppTitle>
			<div className="md:mt-8">
				<MarketChart />
			</div>

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
