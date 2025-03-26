import AppCard from "@components/AppCard";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SOCIAL } from "@utils";
import Image from "next/image";
import { useTranslation } from "next-i18next";

export default function GovernanceTelegramBot() {
	const { t } = useTranslation();
	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(SOCIAL.TelegramApiBot, "_blank");
	};

	return (
		<AppCard>
			<div className="grid max-md:grid-cols-1 md:grid-cols-2">
				<div className="flex flex-col gap-4 p-2 md:px-4 justify-center items-left">
					<div>
						{t("governance.d_euro_api_bot_description")}
					</div>

					<div className="grid grid-cols-1 w-full my-4 ml-6">
						<ul className="flex flex-col gap-4">
							<li className="flex justify-left items-center">
								<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-button-primary-default-bg" />
								<span className="ml-5 text-center">{t("governance.new_minter_proposal_and_vetoed")}</span>
							</li>
							<li className="flex justify-left items-center">
								<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-button-primary-default-bg" />
								<span className="ml-5 text-center">{t("governance.new_leadrate_proposal_and_changed")}</span>
							</li>
							<li className="flex justify-left items-center">
								<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-button-primary-default-bg" />
								<span className="ml-5 text-center">{t("governance.new_position_proposal")}</span>
							</li>
							<li className="flex justify-left items-center">
								<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-button-primary-default-bg" />
								<span className="ml-5 text-center">{t("governance.challenge_started_and_bid_taken")}</span>
							</li>
						</ul>
					</div>

					<div>{t("governance.d_euro_api_bot_description_2")}</div>

					<div className="grid grid-cols-1 w-full my-4 ml-6">
						<ul className="flex flex-col gap-4">
							<li className="flex justify-left items-center">
								<FontAwesomeIcon
									icon={faCircleCheck}
									className="w-8 h-8 bg-layout-secondary rounded-full border-layout-secondary border-2"
									inverse
								/>
								<span className="ml-5 text-center">{t("governance.new_minting_updates")}</span>
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
