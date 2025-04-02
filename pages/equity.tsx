import React from "react";
import Head from "next/head";
import EquityFPSDetailsCard from "@components/PageEquity/EquityFPSDetailsCard";
import EquityInteractionCard from "@components/PageEquity/EquityInteractionCard";
import AppTitle from "@components/AppTitle";

export default function Equity() {
	return (
		<>
			<Head>
				<title>Frankencoin - Equity</title>
			</Head>

			<AppTitle title={`Equity `}></AppTitle>

			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4 container mx-auto">
					<EquityInteractionCard />
					<EquityFPSDetailsCard />
				</section>
			</div>
		</>
	);
}
