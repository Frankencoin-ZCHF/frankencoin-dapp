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
					<div>
						The dEURO API Bot is a Telegram communication tool designed to keep users informed about various activities
						and updates within the dEURO ecosystem.
					</div>

					<div className="grid grid-cols-1 w-full my-4 ml-6">
						<ul className="flex flex-col gap-4">
							<li className="flex justify-left items-center">
								<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-button-primary-default-bg" />
								<span className="ml-5 text-center">New Minter Proposal and Vetoed</span>
							</li>
							<li className="flex justify-left items-center">
								<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-button-primary-default-bg" />
								<span className="ml-5 text-center">New Leadrate Proposal and Changed</span>
							</li>
							<li className="flex justify-left items-center">
								<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-button-primary-default-bg" />
								<span className="ml-5 text-center">New Position Proposal</span>
							</li>
							<li className="flex justify-left items-center">
								<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-button-primary-default-bg" />
								<span className="ml-5 text-center">Challenge Started and Bid Taken</span>
							</li>
						</ul>
					</div>

					<div>Users can subscribe to different types of updates using specific handles.</div>

					<div className="grid grid-cols-1 w-full my-4 ml-6">
						<ul className="flex flex-col gap-4">
							<li className="flex justify-left items-center">
								<FontAwesomeIcon
									icon={faCircleCheck}
									className="w-8 h-8 bg-layout-secondary rounded-full border-layout-secondary border-2"
									inverse
								/>
								<span className="ml-5 text-center">New Minting Updates</span>
							</li>
						</ul>
					</div>
				</div>

				<div className="p-4 flex justify-end items-center">
					<Image
						className="cursor-pointer"
						src="/assets/telegram-qr.png"
						alt="Logo"
						width={450}
						height={450}
						onClick={openExplorer}
					/>
				</div>
			</div>
		</AppCard>
	);
}
