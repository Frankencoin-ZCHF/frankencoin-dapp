import Head from "next/head";
import MonitoringTable from "@components/PageMonitoring/MonitoringTable";
import { useEffect } from "react";
import { RootState, store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import { fetchMarketChart } from "../../redux/slices/prices.slice";
import ChallengesTable from "@components/PageChallenges/ChallengesTable";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import MarketChart from "@components/PageEcoSystem/MarketChart";
import { useSelector } from "react-redux";
import PageTabInput from "@components/Input/PageTabInput";
import AppHeroSteps from "@components/AppHeroSteps";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGavel, faTrophy } from "@fortawesome/free-solid-svg-icons";
import FrankencoinAllocation from "@components/PageEcoSystem/FrankencoinAllocation";
import CollateralOverviewTable from "@components/PageMonitoring/CollateralOverviewTable";

export default function Positions() {
	const posCount = useSelector((state: RootState) => state.positions.openPositions.length);
	const activeChallengeCount = useSelector((state: RootState) => state.challenges.list.list.filter((c) => c.status === "Active").length);

	useEffect(() => {
		store.dispatch(fetchPositionsList());
		store.dispatch(fetchMarketChart());
	}, []);

	return (
		<>
			<Head>
				<title>Frankencoin - Monitoring</title>
			</Head>

			<AppTitle title="Monitoring">
				<div className="text-text-secondary">
					Monitor the health of the Frankencoin protocol. Spot undercollateralized positions, earn a 2% reward by challenging
					them, and buy collateral from active auctions at a discount. Track reserves, supply distribution, and system
					collateralization over time.
				</div>
			</AppTitle>

			<PageTabInput
				tabs={[
					{
						label: "Positions & Auctions",
						badge: activeChallengeCount,
						content: (
							<>
								<div className="mt-8">
									<AppHeroSteps
										steps={[
											{
												title: "Earn rewards by protecting the protocol",
												description:
													"Find undercollateralized positions below, challenge them by putting up your own collateral, and earn 2% of the auction proceeds if the challenge succeeds.",
												icon: <FontAwesomeIcon icon={faTrophy} />,
											},
											{
												title: "Acquire collateral from auctions",
												description:
													"When positions are challenged, their collateral goes to auction. Pay ZCHF to receive the collateral tokens. In Phase 1 at a fixed price, in Phase 2 at a declining price.",
												icon: <FontAwesomeIcon icon={faGavel} />,
											},
										]}
									/>
								</div>

								<AppTitle title="Auctions" badge={String(activeChallengeCount)}>
									<div className="text-text-secondary">
										Buy collateral of challenged or expired positions in a Dutch auction. See the{" "}
										<AppLink
											label="challenges & bids overview"
											href="/monitoring/challenges"
											external={false}
											className=""
										/>{" "}
										for a complete track record.
									</div>
								</AppTitle>

								<ChallengesTable />

								<AppTitle title="Positions" badge={String(posCount)}>
									<div className="text-text-secondary">
										Look out for undercollateralized positions and earn a 2% reward for successfully challenging them.
									</div>
								</AppTitle>

								<MonitoringTable />
							</>
						),
					},
					{
						label: "System Health",
						content: (
							<>
								<AppTitle title="Market">
									<div className="text-text-secondary">
										Price and volume data as reported by{" "}
										<AppLink
											className=""
											label="Coingecko"
											href={"https://www.coingecko.com/en/coins/frankencoin"}
											external={true}
										/>
									</div>
								</AppTitle>
								<div className="md:mt-8">
									<MarketChart />
								</div>

								<AppTitle title={`Frankencoin Holders`}>
									<div className="text-text-secondary">
										This section provides an overview of how the total ZCHF supply is distributed among different
										holders. The circulating supply reflects tokens held in uncategorized wallets, while other portions
										are allocated to protocol reserves, centralized & decentralized exchanges, and external integrations
										such as Morpho.
									</div>
								</AppTitle>
								<div className="my-[2rem]">
									<FrankencoinAllocation />
								</div>
							</>
						),
					},
					{
						label: "Collateral Overview",
						content: (
							<>
								<AppTitle title={`Accepted Collateral Assets`}>
									<div className="text-text-secondary">
										An overview of all collateral types currently accepted by the Frankencoin protocol.
									</div>
								</AppTitle>
								<div className="mt-8">
									<CollateralOverviewTable />
								</div>
							</>
						),
					},
				]}
			/>
		</>
	);
}
