import Head from "next/head";
import MonitoringTable from "@components/PageMonitoring/MonitoringTable";
import { useEffect } from "react";
import { RootState, store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import { fetchMarketChart } from "../../redux/slices/prices.slice";
import { fetchAmplifierList } from "../../redux/slices/amplifiers.slice";
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
import CollateralRiskTable from "@components/PageMonitoring/CollateralRiskTable";
import HealthRatio from "@components/PageEcoSystem/HealthRatio";
import DebtAllocation from "@components/PageEcoSystem/DebtAllocation";
import MintOutstanding from "@components/PageEcoSystem/MintOutstanding";
import ReserveAllocation from "@components/PageEcoSystem/ReserveAllocation";
import { isForceSellable } from "@utils";

export default function Positions() {
	const posCount = useSelector((state: RootState) => state.positions.openPositions.length);
	const activeChallengeCount = useSelector(
		(state: RootState) =>
			state.challenges.list.list.filter((c) => c.status === "Active").length +
			state.positions.openPositions.filter((p) => isForceSellable(p)).length
	);
	const amplifierCount = useSelector((state: RootState) => state.amplifiers.list.length);
	// one row per collateral, plus the CHFAU bridge and one row per amplifier
	const collateralCount = useSelector((state: RootState) => state.positions.openPositionsByCollateral.length) + 1 + amplifierCount;

	useEffect(() => {
		store.dispatch(fetchPositionsList());
		store.dispatch(fetchMarketChart());
		store.dispatch(fetchAmplifierList());
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
					collateralization over time.{" "}
					<AppLink className="" label="Use the Telegram bot for notifications." href="/monitoring/telegram" />
				</div>
			</AppTitle>

			<PageTabInput
				tabs={[
					{
						label: "Positions & Auctions",
						slug: "positions",
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
						slug: "health",
						content: (
							<>
								<AppTitle title={`System Health`}>
									<div className="text-text-secondary">
										Free float collateralization shows the value of the collateral in the Frankencoin system divided by
										its free float supply (defined as total supply minus equity and minter reserves). If it falls below
										100%, the Frankencoin will depeg. In contrast, total supply collateralization is based on the total
										supply. A fall below 100% implies a loss for governance token holders and/or minters.
									</div>
								</AppTitle>

								<div className="md:mt-8">
									<HealthRatio />
								</div>

								<AppTitle title={`Market Data`}>
									<div className="text-text-secondary">
										This section shows the recent exchange rate and 24h trading volume of ZCHF on the open market. Data
										sourced from CoinGecko.
									</div>
								</AppTitle>

								<div className="md:mt-8">
									<MarketChart />
								</div>

								<AppTitle title={`Frankencoin Holders`}>
									<div className="text-text-secondary">
										This section provides an overview of how the total ZCHF supply is distributed among different
										holders. The circulating supply reflects tokens held in uncategorized wallets, while other portions
										are allocated to protocol reserves and centralized & decentralized exchanges.
									</div>
								</AppTitle>
								<div className="my-[2rem]">
									<FrankencoinAllocation />
								</div>

								<AppTitle title={`Current Debt`}>
									<div className="text-text-secondary">
										This section provides an overview of the current debt of all collateral positions. The current debt
										is calculated as the total minted amount of a position minus the reserve contribution, which can be
										reclaimed by repaying the outstanding debt.
									</div>
								</AppTitle>

								<div className="my-[2rem]">
									<DebtAllocation />
								</div>

								<AppTitle title={`Expiration Trajectory`}>
									<div className="text-text-secondary">
										A chart showing by when the Frankencoins currently in circulation need to be repaid by their
										minters.
									</div>
								</AppTitle>

								<div className="my-[2rem]">
									<MintOutstanding />
								</div>

								<AppTitle title={`Reserves`}>
									<div className="text-text-secondary">
										In case a position has to be liquidated because it is not well-collateralized any more, the losses
										are covered by three layers of reserves in the following order: first the minter reserve of the
										liquidated position is used. If that does not suffice, equity capital is burned. If that does not
										suffice either, the reserves of all other positions are proportionally reduced. After all the
										reserves have been burned, a furher loss would reduce the fundamental value of the Frankencoin below
										the peg.
									</div>
								</AppTitle>

								<div className="my-[2rem]">
									<ReserveAllocation />
								</div>
							</>
						),
					},
					{
						label: "Collateral Overview",
						slug: "collateral",
						content: (
							<>
								<AppTitle title={`Accepted Collateral Assets`} badge={String(collateralCount)}>
									<div className="text-text-secondary">
										An overview of all collateral types currently accepted by the Frankencoin protocol, including
										amplified dex positions and swap contracts with other Swiss franc stablecoins.
									</div>
								</AppTitle>
								<div className="mt-8">
									<CollateralOverviewTable />
								</div>

								<AppTitle title="Collateral Risk Parameters">
									<div className="text-text-secondary flex flex-col gap-2">
										<p>
											List of successful collateral proposals and their parameters, as long as they still have at
											least one open position.
										</p>
									</div>
								</AppTitle>
								<div className="mt-8">
									<CollateralRiskTable />
								</div>
							</>
						),
					},
				]}
			/>
		</>
	);
}
