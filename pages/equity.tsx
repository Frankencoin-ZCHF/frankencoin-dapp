import React from "react";
import Head from "next/head";
import EquityNativePoolShareDetailsCard from "@components/PageEquity/EquityNativePoolShareDetailsCard";
import EquityInteractionCard from "@components/PageEquity/EquityInteractionCard";

export default function Equity() {
	return (
		<>
			<Head>
				<title>dEURO - Equity</title>
			</Head>

			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4 container mx-auto">
					<EquityInteractionCard />
					<EquityNativePoolShareDetailsCard />
				</section>
			</div>
		</>
	);
}
