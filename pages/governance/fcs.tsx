import Head from "next/head";
import VotesFcsSection from "@components/PageVotes/VotesFcsSection";

export default function VotesFcs() {
	return (
		<>
			<Head>
				<title>Frankencoin - FCS Votes</title>
			</Head>

			<VotesFcsSection />
		</>
	);
}
