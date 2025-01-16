import Head from "next/head";
import MypositionsTable from "@components/PageMypositions/MypositionsTable";
import MyPositionsChallengesTable from "@components/PageMypositions/MyPositionsChallengesTable";
import MyPositionsBidsTable from "@components/PageMypositions/MyPositionsBidsTable";
import { useRouter } from "next/router";
import { Address } from "viem";
import { shortenAddress } from "@utils";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import { fetchChallengesList } from "../../redux/slices/challenges.slice";
import { fetchBidsList } from "../../redux/slices/bids.slice";
import AppTitle from "@components/AppTitle";
import MyPositionsTotalsCard from "@components/PageMypositions/MyPositionsTotalsCard";

export default function Positions() {
	const router = useRouter();
	const overwrite: Address = router.query.address as Address;

	useEffect(() => {
		store.dispatch(fetchPositionsList());
		store.dispatch(fetchChallengesList());
		store.dispatch(fetchBidsList());
	}, []);

	return (
		<>
			<Head>
				<title>Frankencoin - Positions</title>
			</Head>

			{/* Section Positions */}
			<AppTitle title="Owned Positions">
				<DisplayWarningMessage overwrite={overwrite} />
			</AppTitle>

			<MyPositionsTotalsCard />

			<MypositionsTable />

			{/* Section Challenges */}
			<AppTitle title="Initiated Challenges">
				<DisplayWarningMessage overwrite={overwrite} />
			</AppTitle>

			<MyPositionsChallengesTable />

			{/* Section Bids */}
			<AppTitle title="Bought through Bids">
				<DisplayWarningMessage overwrite={overwrite} />
			</AppTitle>

			<MyPositionsBidsTable />
		</>
	);
}

function DisplayWarningMessage(props: { overwrite: Address }) {
	return (
		<div>
			<span className="font-bold text-sm">{props.overwrite ? `(Public View for: ${shortenAddress(props.overwrite)})` : ""}</span>
		</div>
	);
}
