import Head from "next/head";
import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { store, RootState } from "../../redux/redux.store";
import { fetchChallengesList } from "../../redux/slices/challenges.slice";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import AppTitle from "@components/AppTitle";
import BidderChallengeRow from "@components/PageMonitoringBidder/BidderChallengeRow";

export default function PageBidder() {
	const challenges = useSelector((state: RootState) => state.challenges.list.list);
	const active = useMemo(() => challenges.filter((c) => c.status === "Active"), [challenges]);

	useEffect(() => {
		store.dispatch(fetchChallengesList());
		store.dispatch(fetchPositionsList());
	}, []);

	return (
		<>
			<Head>
				<title>Frankencoin - Flash Bidder</title>
			</Head>

			<AppTitle title="Flash Bidder">
				<div className="text-text-secondary">
					Bid on a running challenge with a flash loan, swap the collateral back via Uniswap and receive the profit directly to
					your wallet.
				</div>
			</AppTitle>

			<div className="md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
				{active.length === 0 ? (
					<div className="md:col-span-2 bg-card-body-primary rounded-lg p-8 text-center text-text-secondary">
						No running challenges.
					</div>
				) : (
					active.map((c) => <BidderChallengeRow key={c.id} challenge={c} />)
				)}
			</div>
		</>
	);
}
