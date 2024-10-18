import Head from "next/head";
import CollateralAndPositionsOverview from "@components/PageEcoSystem/CollateralAndPositionsOverview";
import DistributionZCHF from "@components/PageEcoSystem/DistributionZCHF";

export default function Overview() {
	return (
		<div>
			<Head>
				<title>Frankencoin - EcoSystem</title>
			</Head>

			<div className="flex flex-col gap-[4rem] mt-[4rem]">
				<DistributionZCHF />

				<CollateralAndPositionsOverview />
			</div>
		</div>
	);
}
