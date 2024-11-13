import ChallengesTable from "@components/PageChallenges/ChallengesTable";
import Head from "next/head";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchChallengesList } from "../../redux/slices/challenges.slice";

export default function ChallengesPage() {
	useEffect(() => {
		store.dispatch(fetchChallengesList());
	}, []);

	return (
		<>
			<Head>
				<title>Frankencoin - Auctions</title>
			</Head>

			<div className="md:mt-8">
				<ChallengesTable />
			</div>
		</>
	);
}
