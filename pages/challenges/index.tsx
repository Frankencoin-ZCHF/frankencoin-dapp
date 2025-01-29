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
				<title>dEURO - Auctions</title>
			</Head>

			<div className="md:mt-8">
				<h1 className="sm:hidden text-3xl font-black leading-9 tracking-tight mb-2 mt-4">Auctions</h1>
				<ChallengesTable />
			</div>
		</>
	);
}
