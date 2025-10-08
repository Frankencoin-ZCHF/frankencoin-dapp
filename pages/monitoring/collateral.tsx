import Head from "next/head";
import CollateralAndPositionsOverview from "@components/PageEcoSystem/CollateralAndPositionsOverview";
import AppTitle from "@components/AppTitle";

export default function PageCollateral() {
	return (
		<div>
			<Head>
				<title>Frankencoin - Collaterals</title>
			</Head>

			<AppTitle title={`Accepted Collateral Assets`}>
				<div className="text-text-secondary">
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<CollateralAndPositionsOverview />
			</div>
		</div>
	);
}
