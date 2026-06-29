import Head from "next/head";
import AppTitle from "@components/AppTitle";
import AppHeroSteps from "@components/AppHeroSteps";
import { TelegramLinkStatus } from "@components/PageMonitoring/TelegramLinkStatus";
import { useConnection } from "wagmi";

export default function TelegramMonitoringPage() {
	const { address } = useConnection();

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

			<TelegramLinkStatus address={address} />
		</>
	);
}
