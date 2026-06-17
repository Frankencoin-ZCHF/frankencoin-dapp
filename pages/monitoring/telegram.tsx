import Head from "next/head";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import AppTitle from "@components/AppTitle";
import AppHeroSteps from "@components/AppHeroSteps";
import { TelegramLinkStatus } from "@components/PageMonitoring/TelegramLinkStatus";
import { TelegramAlertsPanel } from "@components/PageMonitoring/TelegramAlertsPanel";

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
						title: "Choose Chat Context",
						description: "Link alerts to your personal chat or to a group — each has its own independent link.",
					},
					{
						icon: 2,
						title: "Link with Telegram",
						description: "Scan the QR code, open the link directly, or copy it to connect your Telegram chat.",
					},
					{
						icon: 3,
						title: "Manage & Get Alerted",
						description: "Select which positions to watch and receive instant Telegram notifications.",
					},
				]}
			/>

			<TelegramLinkStatus />
			<TelegramAlertsPanel />
		</>
	);
}
