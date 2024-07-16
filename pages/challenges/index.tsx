import ChallengesTable from "@components/PageChallenges/ChallengesTable";
import Head from "next/head";

export default function ChallengesPage({}) {
	return (
		<>
			<Head>
				<title>Frankencoin - Auctions</title>
			</Head>

			<div className="mt-[5rem]">
				<ChallengesTable />
			</div>
		</>
	);
}
