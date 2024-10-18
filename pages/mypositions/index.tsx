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
			<div className="md:mt-8">
				<span className="font-bold text-xl">Owned Positions </span>
				<DisplayWarningMessage overwrite={overwrite} />
			</div>

			<div className="md:mt-8">
				<MypositionsTable />
			</div>

			{/* Section Challenges */}
			<div className="md:mt-10">
				<span className="font-bold text-xl">Initiated Challenges</span>
				<DisplayWarningMessage overwrite={overwrite} />
			</div>

			<div className="md:mt-8">
				<MyPositionsChallengesTable />
			</div>

			{/* Section Bids */}
			<div className="md:mt-10">
				<span className="font-bold text-xl">Bought through Bids</span>
				<DisplayWarningMessage overwrite={overwrite} />
			</div>

			<div className="md:mt-8">
				<MyPositionsBidsTable />
			</div>
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
