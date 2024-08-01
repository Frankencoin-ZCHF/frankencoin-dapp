import AppPageHeader from "@components/AppPageHeader";
import ChallengesTable from "@components/PageChallenges/ChallengesTable";
import Head from "next/head";

export default function ChallengesPage({}) {
	return (
		<>
			<Head>
				<title>Frankencoin - Auctions</title>
			</Head>

{/* 			<div>
				<AppPageHeader title="All Active Challenges" />
			</div> */}

			<div className="md:mt-8">
				<ChallengesTable />
			</div>
		</>
	);
}
