import Head from "next/head";
import CollateralAndPositionsOverview from "@components/PageEcoSystem/CollateralAndPositionsOverview";
import AppTitle from "@components/AppTitle";
import DebtOutstanding from "@components/PageEcoSystem/DebtOutstanding";

export default function Overview() {
	return (
		<div>
			<Head>
				<title>Frankencoin - Ecosystem</title>
			</Head>

			<AppTitle title={`Ecosystem Open Debt`}>
				<div className="text-text-secondary">Here you will find the open debt of all position</div>
			</AppTitle>

			<div className="my-[2rem]">
				<DebtOutstanding />
			</div>

			<AppTitle title={`Ecosystem Collateral`}>
				<div className="text-text-secondary">Here you will find all relevant details of all collateral positions</div>
			</AppTitle>

			<div className="my-[2rem]">
				<CollateralAndPositionsOverview />
			</div>
		</div>
	);
}
