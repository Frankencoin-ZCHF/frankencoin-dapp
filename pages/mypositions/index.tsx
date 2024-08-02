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

			<div>
				<AppPageHeader title="Owned Positions" />
			</div>

			<div className="md:mt-8">
				<MypositionsTable />
			</div>

			<div>
				<AppPageHeader title="Initiated Challenges" />
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
