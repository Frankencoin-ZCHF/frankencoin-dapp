import Head from "next/head";
import StableCoinBridgeXCHF from "@components/PageEcoSystem/StableCoinBridgeXCHF";
import CollateralAndPositionsOverview from "@components/PageEcoSystem/CollateralAndPositionsOverview";

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
