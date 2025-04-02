import React, { useEffect, useState } from "react";
import Head from "next/head";
import EquityFPSDetailsCard from "@components/PageEquity/EquityFPSDetailsCard";
import EquityInteractionCard from "@components/PageEquity/EquityInteractionCard";
import AppTitle from "@components/AppTitle";
import { useAccount } from "wagmi";
import { FPSBalanceHistory } from "../hooks/FPSBalanceHistory";
import { FPSEarningsHistory } from "../hooks/FPSEarningsHistory";
import ReportsFPSYearlyTable from "@components/PageReports/ReportsFPSYearlyTable";
import { zeroAddress } from "viem";

export default function Equity() {
	const { address } = useAccount();
	const [fpsHistory, setFpsHistory] = useState<FPSBalanceHistory[]>([]);
	const [fpsEarnings, setFpsEarnings] = useState<FPSEarningsHistory[]>([]);

	useEffect(() => {
		if (address == undefined) {
			setFpsHistory([]);
			setFpsEarnings([]);
			return;
		}

		const fetcher = async () => {
			try {
				const responseBalance = await FPSBalanceHistory(address);
				setFpsHistory(responseBalance.reverse());

				const responseEarnings = await FPSEarningsHistory(address);
				setFpsEarnings(responseEarnings.reverse());
			} catch (error) {
				console.log(error);
			}
		};

		fetcher();
	}, [address]);

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

			{address != undefined && (
				<>
					<AppTitle title="FPS Holder Earnings" />
					<ReportsFPSYearlyTable address={address || zeroAddress} fpsHistory={fpsHistory} fpsEarnings={fpsEarnings} />
				</>
			)}
		</>
	);
}
