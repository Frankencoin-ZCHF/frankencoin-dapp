import QRCode from "react-qr-code";
import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import { getBotUrl } from "../../redux/slices/telegram.slice";

interface Props {
	address?: string;
}

export function TelegramLinkStatus({ address }: Props) {
	const url = getBotUrl(address);
	const label = address ? "Scan to track this owner in Telegram" : "Scan to open Frankencoin Bot";
	const labelUrl = address ? "Click to track this owner in Telegram" : "Click to open Frankencoin Bot";

	return (
		<AppCard className="flex flex-col items-center gap-3 px-4 py-6">
			<div className="text-sm text-text-secondary">{label}</div>
			<div className="bg-white p-4 rounded-xl">
				<QRCode value={url} size={180} />
			</div>
			<AppLink label={labelUrl} href={url} external copy copyValue={url} />
		</AppCard>
	);
}
