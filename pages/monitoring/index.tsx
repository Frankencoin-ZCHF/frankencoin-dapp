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

			<AppTitle title="Market">
				<div className="text-text-secondary">
					Price and volume data as reported by{" "}
					<AppLink className="" label="Coingecko" href={"https://www.coingecko.com/en/coins/frankencoin"} external={true} />
				</div>
			</AppTitle>
			<div className="md:mt-8">
				<MarketChart />
			</div>

			<AppTitle title="Positions">
				<div className="text-text-secondary">
					Look out for undercollateralized positions and earn a 2% reward for successfully challenging them.
				</div>
			</AppTitle>
			<div className="md:mt-8">
				<MonitoringTable />
			</div>

			<AppTitle title="Auctions">
				<div className="text-text-secondary">
					Buy collateral of challenged or expired positions in a Dutch auction. See the{" "}
					<AppLink label="challenges & bids overview" href="/monitoring/challenges" external={false} className="" /> for a
					complete track record.
				</div>
			</AppTitle>
			<div className="md:mt-8">
				<ChallengesTable />
			</div>
			<AppTitle title="Further Tools">
				<div className="text-text-secondary">
					Have a look at the{" "}
					<AppLink label="collaterals overview" href="/monitoring/collateral" external={false} className="" />, a{" "}
					<AppLink label="general system metrics" href="/monitoring/ecosystem" external={false} className="" />, or the{" "}
					<AppLink className="" label="transaction logbook" href={"/monitoring/logs?kind=Frankencoin"} external={false} />.
				</div>
			</AppTitle>
		</>
	);
}
