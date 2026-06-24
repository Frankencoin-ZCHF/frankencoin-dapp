import Head from "next/head";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import AppTitle from "@components/AppTitle";
import AppHeroSteps from "@components/AppHeroSteps";
import { TelegramLinkStatus } from "@components/PageMonitoring/TelegramLinkStatus";

export default function TelegramMonitoringPage() {
	useEffect(() => {
		store.dispatch(fetchPositionsList());
	}, []);

	return (
		<>
			<Head>
				<title>Frankencoin - Telegram Alerts</title>
			</Head>

			<AppTitle title="Telegram Alerts" />

			<AppHeroSteps
				steps={[
					{
						icon: 1,
						title: "Open the Bot",
						description: "Scan or click the link below to open the Frankencoin Bot on Telegram.",
					},
					{
						icon: 2,
						title: "Subscribe",
						description:
							"Type /start for all alerts, /start GOV for governance, /start ALL for all positions, or /start <address> to track an owner.",
					},
					{
						icon: 3,
						title: "Get Alerted",
						description: "Receive instant notifications directly in your Telegram chat.",
					},
				]}
			/>

			<TelegramLinkStatus />
		</>
	);
}
