import Head from "next/head";
import MypositionsCollateral from "@components/PageMypositions/MypositionsCollateral";
import MypositionsTable from "@components/PageMypositions/MypositionsTable";
import AppPageHeader from "@components/AppPageHeader";
import MyPositionsChallengesTable from "@components/PageMypositions/MyPositionsChallengesTable";

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

			{/* <div>
				<AppPageHeader title="Your Bids" />
			</div>

			<div className="md:mt-8">
				<MypositionsTable />
			</div> */}
		</>
	);
}
