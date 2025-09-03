import Head from "next/head";
import CollateralAndPositionsOverview from "@components/PageEcoSystem/CollateralAndPositionsOverview";
import AppTitle from "@components/AppTitle";
import DebtOutstanding from "@components/PageEcoSystem/DebtOutstanding";
import DebtAllocation from "@components/PageEcoSystem/DebtAllocation";

export default function Overview() {
	return (
		<div>
			<Head>
				<title>Frankencoin - Ecosystem</title>
			</Head>

			<AppTitle title={`Current Debt Allocation`}>
				<div className="text-text-secondary">Here you will find the open debt of all collaterals</div>
			</AppTitle>

			<div className="my-[2rem]">
				<DebtAllocation />
			</div>

			<AppTitle title={`Open Debt Projected`}>
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
