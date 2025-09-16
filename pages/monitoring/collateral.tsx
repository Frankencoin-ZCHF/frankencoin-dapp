import Head from "next/head";
import CollateralAndPositionsOverview from "@components/PageEcoSystem/CollateralAndPositionsOverview";
import AppTitle from "@components/AppTitle";

export default function PageCollateral() {
	return (
		<div>
			<Head>
				<title>Frankencoin - Collaterals</title>
			</Head>

			<AppTitle title={`Ecosystem Collaterals`}>
				<div className="text-text-secondary">
					Here, you will find detailed information on all collateral positions, summarized with the most important details.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<CollateralAndPositionsOverview />
			</div>
		</div>
	);
}
