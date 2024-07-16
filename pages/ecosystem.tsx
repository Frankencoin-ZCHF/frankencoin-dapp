import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import StableCoinBridgeXCHF from "@components/PageEcoSystem/StableCoinBridgeXCHF";
import CollateralAndPositionsOverview from "@components/PageEcoSystem/CollateralAndPositionsOverview";
import SupervisionCollateral from "@components/PageSupervision/SupervisionCollateral";

export default function Overview() {
	return (
		<div>
			<Head>
				<title>Frankencoin - EcoSystem</title>
			</Head>

			<div className="flex flex-col gap-[4rem] mt-[4rem]">
				<StableCoinBridgeXCHF />
				<CollateralAndPositionsOverview />
			</div>
		</div>
	);
}
