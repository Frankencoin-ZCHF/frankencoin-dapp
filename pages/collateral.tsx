import Head from "next/head";
import OverviewTVL from "@components/OverviewTVL";
import Link from "next/link";
import AppPageHeader from "@components/AppPageHeader";
import TokenLogo from "@components/TokenLogo";

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
