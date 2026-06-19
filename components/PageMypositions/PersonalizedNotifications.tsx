import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import { TelegramLinkStatus } from "@components/PageMonitoring/TelegramLinkStatus";

export default function PersonalizedNotifications() {
	return (
		<>
			<AppTitle title="Personalized Notifications">
				<div className="text-text-secondary">
					Connect to the Frankencoin Telegram Bot to get alerts when your positions expire, when your positions are challenged,
					or when the market price falls to less than 10% above the liquidation price. This service is provided on a best-effort
					basis without any guarantees. To subscribe to alerts relevant for general monitoring and governance, visit the{" "}
					<AppLink className="" label="governance page" href="/governance#api-bot" external={false} />.
				</div>
			</AppTitle>

			<TelegramLinkStatus />
		</>
	);
}
