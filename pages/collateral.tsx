import Head from "next/head";
import OverviewTVL from "@components/OverviewTVL";
import AppPageHeader from "@components/AppPageHeader";

export default function Overview() {
	return (
		<div>
			<Head>
				<title>Frankencoin - Collateral</title>
			</Head>

			<AppPageHeader title="Positions By Collateral" />
			<OverviewTVL />
		</div>
	);
}
