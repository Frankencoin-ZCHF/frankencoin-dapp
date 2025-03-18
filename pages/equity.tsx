import React from "react";
import Head from "next/head";
import EquityFPSDetailsCard from "@components/PageEquity/EquityFPSDetailsCard";
import EquityInteractionCard from "@components/PageEquity/EquityInteractionCard";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import { ContractUrl, shortenAddress } from "@utils";
import { ADDRESS } from "@frankencoin/zchf";
import { WAGMI_CHAIN } from "../app.config";

export default function Equity() {
	const { equity, wFPS } = ADDRESS[WAGMI_CHAIN.id];
	return (
		<>
			<Head>
				<title>Frankencoin - Equity</title>
			</Head>

			<AppTitle title={`Equity `}>
				<div className="text-text-secondary">
					View the Smart Contract in the explorer{" "}
					<AppLink label={shortenAddress(equity) + "."} href={ContractUrl(equity)} external={true} className="pr-1" />
					View the Smart Contract of the Wrapped Version in the explorer{" "}
					<AppLink label={shortenAddress(wFPS) + "."} href={ContractUrl(wFPS)} external={true} className="pr-1" />
				</div>
			</AppTitle>

			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4 container mx-auto">
					<EquityInteractionCard />
					<EquityFPSDetailsCard />
				</section>
			</div>
		</>
	);
}
