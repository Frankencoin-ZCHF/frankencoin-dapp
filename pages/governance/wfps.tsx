import Head from "next/head";
import VotesWfpsSection from "@components/PageVotes/VotesWfpsSection";

export default function VotesWfps() {
	return (
		<>
			<Head>
				<title>Frankencoin - WFPS Votes</title>
			</Head>

			<VotesWfpsSection />
		</>
	);
}
