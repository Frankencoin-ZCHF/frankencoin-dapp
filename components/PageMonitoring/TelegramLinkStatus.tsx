import QRCode from "react-qr-code";
import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import { getBotUrl } from "../../redux/slices/telegram.slice";

interface Props {
	address?: string;
}

export function TelegramLinkStatus({ address }: Props) {
	const url = getBotUrl(address);
	const label = address ? `Setup alerts for all positions owned by ${address}` : "Setup alerts in Telegram";
	const labelUrl = address ? `Initiate alerts in Telegram` : "Open Frankencoin Bot in Telegram";

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
