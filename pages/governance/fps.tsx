import Head from "next/head";
import VotesFpsSection from "@components/PageVotes/VotesFpsSection";

export default function VotesFps() {
	return (
		<>
			<Head>
				<title>Frankencoin - FPS Votes</title>
			</Head>

			<VotesFpsSection />
		</>
	);
}
