import Button from "@components/Button";
import { TextInputOutlined } from "@components/Input/TextInputOutlined";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

const ExplanationItem = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
	<div className="max-w-[28rem] h-14 justify-start items-start gap-3 flex">
		<div className="w-10 h-10 bg-[#f2f7fd] rounded-full flex justify-center items-center">
			<img src={icon} width={20} height={20} />
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
		<div
			onClick={copyReferralLink}
			className="px-4 py-2.5 bg-layout-secondary rounded-lg justify-between items-center inline-flex overflow-hidden"
		>
			<div className="w-80 grow shrink basis-0 text-white text-base font-extrabold leading-normal">
				{isCopied ? contentOnCopy : text}
			</div>
			<div>
				<FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className="w-5 h-5 relative text-white overflow-hidden" />
			</div>
		</div>
	);
};

export const ReferralCenterSection = () => {
	const [hasInvested, setHasInvested] = useState(true);
	const [referralName, setReferralName] = useState("");
	const [referralLink, setReferralLink] = useState("");

	const createReferralLink = () => {
		const refLink = `https://deuro.com/referral/${referralName}`;
		navigator.clipboard.writeText(refLink);
		setReferralLink(refLink);
		setReferralName("");
	};

	return (
		<div className="flex-col justify-start items-center gap-12 inline-flex">
			<div className="bg-white rounded-xl flex-col justify-start items-start flex overflow-hidden">
				<div className="self-stretch p-8 border-b border-borders-primary inline-flex">
					<div className="self-stretch w-1/2 flex-col justify-center items-start gap-5 inline-flex">
						<div className="flex-col justify-start items-start gap-3 flex">
							<div>
								<div className="w-11 h-11 bg-borders-primary rounded-full flex justify-center items-center">
									<img src="/icons/chest_dark.svg" width={26} height={26} />
								</div>
							</div>
							<div className="text-text-primary text-3xl font-black leading-9 tracking-tight">Referral Center</div>
						</div>
						<div className="flex-col justify-start items-start gap-2 flex">
							{hasInvested ? (
								<div className="flex-col justify-start items-start flex gap-2">
									<div className="text-text-label text-sm font-normal leading-tight tracking-wide">
										Set up your unique referral link
									</div>
									<div className="min-h-14 flex-row items-center flex gap-2">
										{referralLink ? (
											<CopyLinkButton text={referralLink} contentOnCopy="... copied! Let´s go." />
										) : (
											<>
												<div className="w-80">
													<TextInputOutlined
														className="-ml-1"
														placeholder="Type your desired ref. name"
														value={referralName}
														onChange={(value) => setReferralName(value)}
													/>
												</div>
												<div className="w-24">
													<Button onClick={createReferralLink} disabled={!referralName} className="w-24 h-11">
														Create
													</Button>
												</div>
											</>
										)}
									</div>
								</div>
							) : (
								<>
									<div className="flex-col justify-start items-start flex">
										<div className="text-text-label text-sm font-normal leading-tight tracking-wide">
											Share your unique referral link
										</div>
									</div>
									<Button
										onClick={() => setHasInvested(true) /* TODO: add investment logic */}
										className="h-11 px-4 py-2.5 bg-borders-primary rounded-lg justify-start items-center gap-2 inline-flex overflow-hidden"
									>
										<div className="text-text-icon text-base font-extrabold leading-normal">
											Invest to get your referral link
										</div>
									</Button>
								</>
							)}
						</div>
					</div>
					{hasInvested && (
						<div className="w-1/2 self-stretch flex-col justify-start items-start gap-6 flex">
							<ExplanationItem
								icon="/icons/solar_link-bold.svg"
								title="Share your referral link"
								description="Invite your friends so that they can benefit from the dEURO system too."
							/>
							<ExplanationItem
								icon="/icons/union.svg"
								title="Your friend joins"
								description="When your friend follows the link and connects their wallet, you will be registered as their referrer."
							/>
							<ExplanationItem
								icon="/icons/ph_hand-coins-light.svg"
								title="Get rewarded"
								description="You receive 1% of the revenues and fees they generate. The rewards are paid out in dEURO."
							/>
						</div>
					)}
				</div>
				<div className="relative bg-text-primary overflow-hidden">
					<div className="absolute h-full w-[50%] px-16 flex-col justify-center items-start gap-4 inline-flex">
						<div className="self-stretch text-text-muted text-5xl font-black leading-tight">
							Earn 1% on investments, loans and savings!
						</div>
					</div>
					<div className="pl-0.5 justify-end items-center inline-flex overflow-hidden">
						<img src="/assets/Ref_teaser_image@2x.webp" />
					</div>
				</div>
				<div className="self-stretch justify-start items-start inline-flex">
					<div className="grow shrink basis-0 p-8 border-r border-borders-primary flex-col justify-start items-center gap-4 inline-flex">
						<div className="text-text-primary text-base font-medium leading-tight">Total Bonus Volume</div>
						<div className="justify-center items-center gap-2.5 inline-flex">
							<div className="grow shrink basis-0 text-menu-wallet-bg text-2xl font-extrabold leading-normal">€ 00.00</div>
						</div>
					</div>
					<div className="grow shrink basis-0 p-8 border-r border-borders-primary flex-col justify-start items-center gap-4 inline-flex">
						<div className="text-text-primary text-base font-medium leading-tight">Available to claim</div>
						<div className="justify-center items-center gap-2.5 inline-flex">
							<div className="grow shrink basis-0 text-menu-wallet-bg text-2xl font-extrabold leading-normal">€ 00.00</div>
						</div>
					</div>
					<div className="grow shrink basis-0 p-8 flex-col justify-start items-center gap-4 inline-flex">
						<div className="text-text-primary text-base font-medium leading-tight">Total referred</div>
						<div className="flex-col justify-center items-center gap-2.5 flex">
							<div className="text-menu-wallet-bg text-2xl font-extrabold leading-normal">0</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
