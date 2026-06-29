import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SOCIAL } from "@utils";
import Image from "next/image";

const NOTIFICATIONS = [
	"New Minter Proposal and Vetoed",
	"New Leadrate Proposal and Changes",
	"New Position Proposal and Expiring",
	"Challenge Started and Bid Taken",
	"Minting Notifications",
];

export default function GovernanceTelegramBot() {
	const openBot = (e: React.MouseEvent) => {
		e.preventDefault();
		window.open(SOCIAL.TelegramApiBot, "_blank");
	};

	return (
		<AppCard>
			<div className="flex flex-col items-center gap-8 p-2 md:flex-row md:items-center md:gap-12 md:p-4">
				{/* Description + notification list + call to action */}
				<div className="flex flex-1 flex-col gap-5">
					<div className="text-text-secondary">
						The Notification Bot is a Telegram bot that can notify you about events relevant to the governance of the system.
					</div>

					<ul className="flex flex-col gap-3">
						{NOTIFICATIONS.map((item) => (
							<li key={item} className="flex items-center gap-3">
								<FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5 flex-shrink-0 text-card-body-secondary" />
								<span>{item}</span>
							</li>
						))}
					</ul>

					<AppLink className="mt-1" label="Open Notification Bot in Telegram" href={SOCIAL.TelegramApiBot} external />
				</div>

				{/* QR code */}
				<div className="flex flex-shrink-0 flex-col items-center gap-3">
					<button onClick={openBot} className="rounded-xl bg-white p-4" aria-label="Open Notification Bot in Telegram">
						<Image
							className="cursor-pointer"
							src="/assets/telegram-qr-2.png"
							alt="Telegram Notification Bot QR code"
							width={200}
							height={200}
						/>
					</button>
				</div>
			</div>
		</AppCard>
	);
}
