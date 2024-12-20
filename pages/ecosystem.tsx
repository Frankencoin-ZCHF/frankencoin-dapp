import Head from "next/head";
import CollateralAndPositionsOverview from "@components/PageEcoSystem/CollateralAndPositionsOverview";
import DistributionDEURO from "@components/PageEcoSystem/DistributionDEURO";

export default function Overview() {
	return (
		<div>
			<Head>
				<title>dEURO - EcoSystem</title>
			</Head>

			<div className="flex flex-col gap-[4rem] mt-[4rem]">
				<DistributionDEURO />

				<CollateralAndPositionsOverview />
			</div>
		</div>
	);
}
