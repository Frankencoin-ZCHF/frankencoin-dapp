import { useState } from "react";
import Image from "next/image";
import Button from "@components/Button";
import { TextInputOutlined } from "@components/Input/TextInputOutlined";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "next-i18next";

const ExplanationItem = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
	<div className="max-w-[28rem] justify-start items-start gap-3 flex">
		<div className="w-10 h-10 bg-[#f2f7fd] rounded-full flex justify-center items-center">
			<Image src={icon} width={20} height={20} alt={title} />
		</div>
		<div className="grow shrink basis-0 flex-col justify-center items-start">
			<div className="self-stretch text-base font-extrabold leading-tight">{title}</div>
			<div className="mt-1 self-stretch text-sm font-normal leading-tight">{description}</div>
		</div>
	</div>
);

export const CopyLinkButton = ({ text, contentOnCopy }: { text: string; contentOnCopy: string }) => {
	const [isCopied, setIsCopied] = useState(false);

	const copyReferralLink = () => {
		navigator.clipboard.writeText(text);
		setIsCopied(true);
		setTimeout(() => setIsCopied(false), 2000);
	};

	return (
		<div className="flex w-full sm:w-[80%] min-w-fit">
			<Button
				onClick={copyReferralLink}
				className={`!px-4 !py-2.5 ${
					isCopied ? "bg-[#0d3e7c]" : "bg-borders-primary"
				} rounded-lg justify-between items-center inline-flex overflow-hidden`}
			>
				<span className="basis-0 text-white text-sm sm:text-base font-extrabold leading-normal">
					{isCopied ? contentOnCopy : text}
				</span>
				<span>
					<FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className="w-4 h-4 sm:w-5 sm:h-5 relative text-white overflow-hidden" />
				</span>
			</Button>
		</div>
	);
};

export const ReferralCenterSection = () => {
	const [referralName, setReferralName] = useState("");
	const [referralLink, setReferralLink] = useState("");
	const { t } = useTranslation();

	const createReferralLink = () => {
		const refLink = `https://deuro.com/referral/${referralName}`;
		navigator.clipboard.writeText(refLink);
		setReferralLink(refLink);
		setReferralName("");
	};

	return (
		<div className="w-full self-stretch flex-col rounded-xl justify-start items-center gap-12 inline-flex shadow-card">
			<div className="w-full bg-white rounded-xl flex-col justify-start items-start flex overflow-hidden">
				<div className="self-stretch p-4 sm:p-8 border-b border-borders-primary flex justify-between flex-col sm:flex-row">
					<div className="self-stretch flex-col justify-center items-start gap-5 inline-flex sm:w-1/2">
						<div className="flex-col justify-start items-start gap-3 flex">
							<div className="w-8 h-8 sm:w-11 sm:h-11 bg-borders-primary rounded-full flex justify-center items-center">
								<Image src="/icons/chest_dark.svg" width={28} height={28} alt="Chest" className="w-5 h-5 sm:w-6 sm:h-6" />
							</div>
							<div className="text-text-primary text-2xl sm:text-4xl font-black !leading-none">{t("referrals.referral_center")}</div>
						</div>
						<div className="flex-col self-stretch justify-start items-start flex gap-1.5">
							<div className="text-text-label text-sm font-normal leading-tight tracking-wide">
								{t("referrals.set_up_your_unique_referral_link")}
							</div>
							<div className="min-h-10 sm:min-h-14 self-stretch flex-row items-center flex gap-2">
								{referralLink ? (
									<CopyLinkButton text={referralLink} contentOnCopy={t("referrals.copied_let_s_go")} />
								) : (
									<>
										<TextInputOutlined
											className="grow max-w-80"
											placeholder={t("referrals.type_your_desired_ref_name")}
											value={referralName}
											onChange={(value) => setReferralName(value)}
										/>
										<Button onClick={createReferralLink} disabled={!referralName} className="h-10 sm:h-12 !w-fit text-sm sm:text-base">
											{t("referrals.create")}
										</Button>
									</>
								)}
							</div>
						</div>
					</div>
					<div className="my-6 sm:my-0 self-stretch flex-col justify-start items-start gap-6 flex sm:w-1/2">
						<ExplanationItem
							icon="/icons/solar_link-bold.svg"
							title={t("referrals.share_your_referral_link")}
							description={t("referrals.invite_friends")}
						/>
						<ExplanationItem
							icon="/icons/union.svg"
							title={t("referrals.your_friend_joins")}
							description={t("referrals.your_friend_joins_description")}
						/>
						<ExplanationItem
							icon="/icons/ph_hand-coins-light.svg"
							title={t("referrals.get_reward")}
							description={t("referrals.get_reward_description")}
						/>
					</div>
				</div>
				{/** Hero Image */}
				<div className="hidden sm:block relative bg-text-primary overflow-hidden">
					<div className="absolute h-full w-[50%] px-16 flex-col justify-center items-start gap-4 inline-flex">
						<div className="self-stretch text-text-muted text-5xl font-black leading-tight text-transparent bg-clip-text bg-gradient-to-b from-[#8B92A8] to-[#5D647B]">
							{t("referrals.earn_1_on_investments_loans_and_savings")}
						</div>
					</div>
					<div className="pl-0.5 justify-end items-center inline-flex overflow-hidden">
						<Image
							src="/assets/Ref_teaser_image@2x.png"
							alt="Referral Center Teaser"
							width={1212}
							height={319}
							quality={100}
							priority
						/>
					</div>
				</div>
				{/** Stats */}
				<div className="self-stretch flex">
					<div className="flex-1 p-4 sm:p-8 border-r border-borders-primary flex-col justify-between items-center gap-4 inline-flex">
						<div className="text-text-primary text-sm sm:text-base text-center font-medium leading-tight">
							{t("referrals.total_bonus_volume")}
						</div>
						<div className="justify-center items-center gap-2.5 inline-flex">
							<div className="grow shrink basis-0 text-menu-wallet-bg text-xl sm:text-2xl font-extrabold leading-normal">
								€ 00.00
							</div>
						</div>
					</div>
					<div className="flex-1 p-4 sm:p-8 border-r border-borders-primary flex-col justify-between items-center gap-4 inline-flex">
						<div className="text-text-primary text-sm sm:text-base text-center font-medium leading-tight">
							{t("referrals.available_to_claim")}
						</div>
						<div className="justify-center items-center gap-2.5 inline-flex">
							<div className="grow shrink basis-0 text-menu-wallet-bg text-xl sm:text-2xl font-extrabold leading-normal">
								€ 00.00
							</div>
						</div>
					</div>
					<div className="flex-1 p-4 sm:p-8 flex-col justify-between items-center gap-4 inline-flex">
						<div className="text-text-primary text-sm sm:text-base text-center font-medium leading-tight">
							{t("referrals.total_referred")}
						</div>
						<div className="flex-col justify-center items-center gap-2.5 flex">
							<div className="text-menu-wallet-bg text-xl sm:text-2xl font-extrabold leading-normal">0</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
