import Head from "next/head";
import MypositionsTable from "@components/PageMypositions/MypositionsTable";
import MyPositionsChallengesTable from "@components/PageMypositions/MyPositionsChallengesTable";
import MyPositionsBidsTable from "@components/PageMypositions/MyPositionsBidsTable";

export default function Positions() {
	return (
		<>
			<Head>
				<title>Frankencoin - Positions</title>
			</Head>

			<div className="md:mt-8">
				<span className="font-bold text-xl">Owned Positions</span>
			</div>

			<div className="md:mt-8">
				<MypositionsTable />
			</div>

			<div className="md:mt-10">
				<span className="font-bold text-xl">Initiated Challenges</span>
			</div>

			<div className="md:mt-8">
				<MyPositionsChallengesTable />
			</div>

			<div className="md:mt-10">
				<span className="font-bold text-xl">Bought through Bids</span>
			</div>

			<div className="md:mt-8">
				<MyPositionsBidsTable />
			</div>
		</>
	);
}
