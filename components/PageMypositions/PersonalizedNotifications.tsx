import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import { TelegramLinkStatus } from "@components/PageMonitoring/TelegramLinkStatus";
import { useConnection } from "wagmi";

export default function PersonalizedNotifications() {
	const { address } = useConnection();

	return (
		<>
			<AppTitle title="Personalized Notifications">
				<div className="text-text-secondary">
					Get alerts when your positions expire, when your positions are challenged, or when the market price falls to less than
					10% above the liquidation price. Open the Frankencoin Bot on Telegram and type{" "}
					<span className="font-mono text-text-primary">/start &lt;your address&gt;</span> to track your positions. This service
					is provided on a best-effort basis without any guarantees. For governance and general monitoring alerts, visit the{" "}
					<AppLink className="" label="monitoring page" href="/monitoring/telegram" external={false} />.
				</div>
			</AppTitle>

			<TelegramLinkStatus address={address} />
		</>
	);
}
