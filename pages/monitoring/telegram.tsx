import Head from "next/head";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import AppTitle from "@components/AppTitle";
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

			<TelegramLinkStatus />
			<TelegramAlertsPanel />
		</>
	);
}
