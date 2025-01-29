import AppCard from "@components/AppCard";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SOCIAL } from "@utils";
import Image from "next/image";

export default function GovernanceTelegramBot() {
	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(SOCIAL.TelegramApiBot, "_blank");
	};

	return (
		<AppCard>
			<div className="grid max-md:grid-cols-1 md:grid-cols-2">
				<div className="flex flex-col gap-4 p-2 md:px-4 justify-center items-left">
					<div className="text-text-secondary">
						The Frankencoin API Bot is a Telegram communication tool designed to keep users informed about various activities
						and updates within the Frankencoin ecosystem.
					</div>

					<div className="grid grid-cols-1 w-full my-4 md:ml-6 max-md:ml-2">
						<ul className="flex flex-col gap-4">
							<li className="flex justify-left items-center">
								<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-card-body-secondary" />
								<span className="ml-5 text-center">New Minter Proposal and Vetoed</span>
							</li>
							<li className="flex justify-left items-center">
								<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-card-body-secondary" />
								<span className="ml-5 text-center">New Leadrate Proposal and Changes</span>
							</li>
							<li className="flex justify-left items-center">
								<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-card-body-secondary" />
								<span className="ml-5 text-center">New Position Proposal and Expiring</span>
							</li>
							<li className="flex justify-left items-center">
								<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-card-body-secondary" />
								<span className="ml-5 text-center">Challenge Started and Bid Taken</span>
							</li>
						</ul>
					</div>

					<div className="text-text-secondary">Users can subscribe to different types of updates using specific handles.</div>

					<div className="grid grid-cols-1 w-full my-4 md:ml-6 max-md:ml-2">
						<ul className="flex flex-col gap-4">
							<li className="flex justify-left items-center">
								<FontAwesomeIcon
									icon={faCircleCheck}
									className="w-8 h-8 bg-card-body-secondary rounded-full border-card-body-secondary border-2"
									inverse
								/>
								<span className="ml-5 text-center">New Minting Updates</span>
							</li>
						</ul>
					</div>
				</div>

				<div className="">
					<Image
						className="cursor-pointer"
						src="/assets/telegram-qr.png"
						alt="Logo"
						width={1000}
						height={1000}
						onClick={openExplorer}
					/>
				</div>
			</div>
		</AppCard>
	);
}
