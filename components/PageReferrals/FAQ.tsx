import { useState, ReactNode } from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SectionTitle } from "@components/SectionTitle";
import { useTranslation } from "next-i18next";

const ExpandableFAQ = ({ question, answer, separator = true }: { question: string; answer: string | ReactNode; separator?: boolean }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div
			onClick={() => setIsExpanded((p) => !p)}
			className={`self-stretch py-3 sm:py-6 ${
				separator ? "border-b border-borders-secondary" : ""
			} flex-col justify-center items-start gap-2 flex`}
		>
			<div className="self-stretch justify-start items-center gap-14 inline-flex">
				<div className="grow shrink basis-0 text-text-primary text-base sm:text-xl font-black leading-tight sm:leading-7">{question}</div>
				<FontAwesomeIcon
					icon={faChevronDown}
					className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
				/>
			</div>
			<div
				className={`self-stretch pl-4 sm:pl-8 pr-4 sm:pr-32 justify-start items-center gap-14 inline-flex overflow-hidden transition-all duration-300 ${
					isExpanded ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
				}`}
			>
				<div className="grow shrink basis-0 text-text-label text-base sm:text-xl leading-normal sm:leading-7">{answer}</div>
			</div>
		</div>
	);
};

export const FAQ = () => {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col gap-2 sm:gap-0">
			<SectionTitle>{t("referrals.faq")}</SectionTitle>
			<div className="px-4 sm:px-12 py-2 sm:py-4 bg-white rounded-xl shadow-card flex-col justify-start items-start inline-flex">
				<ExpandableFAQ
					question={t("referrals.who_is_entitled_to_participate_in_the_referral_system")}
					answer={t("referrals.who_is_entitled_to_participate_in_the_referral_system_answer")}
				/>
				<ExpandableFAQ
					question={t("referrals.is_there_a_limit_to_how_many_referrals_i_can_earn_bonus_for")}
					answer={t("referrals.is_there_a_limit_to_how_many_referrals_i_can_earn_bonus_for_answer")}
				/>
				<ExpandableFAQ
					question={t("referrals.how_do_i_join_the_referral_program")}
					answer={t("referrals.how_do_i_join_the_referral_program_answer")}
				/>
				<ExpandableFAQ
					question={t("referrals.how_and_how_often_will_i_be_paid")}
					answer={
						<div className="text-text-label text-xl leading-7 flex flex-col gap-4">
							<span>{t("referrals.how_and_how_often_will_i_be_paid_answer")}</span>
							<div>
								<span>{t("referrals.your_referral_uses")}</span>
								<ul className="list-disc pl-6 mt-2 ml-2">
									<li>{t("referrals.the_borrow_module_direct_payout")}</li>
									<li>{t("referrals.the_savings_module_pro_rata_daily_payout")}</li>
									<li>{t("referrals.the_equity_module_direct_payout")}</li>
								</ul>
							</div>
							<span>
								{t("referrals.in_addition_there_are_sign_up_bonuses_which_are_paid_out_directly_as_soon_as_the_referrer_invests_in_the_saving_equity_or_borrow_module_of_the_deuro_protocol_for_the_first_time")}
							</span>
							<span>{t("referrals.your_referral_bonus_can_be_claimed_by_you_at_any_time")}</span>
						</div>
					}
				/>
				<ExpandableFAQ
					question={t("referrals.how_do_i_receive_my_referral_bonus")}
					answer={t("referrals.how_do_i_receive_my_referral_bonus_answer")}
				/>
				<ExpandableFAQ
					question={t("referrals.if_my_friend_forgets_to_use_the_referral_link_or_code_can_i_still_receive_the_bonus")}
					answer={t("referrals.if_my_friend_forgets_to_use_the_referral_link_or_code_can_i_still_receive_the_bonus_answer")}
					separator={false}
				/>
			</div>
		</div>
	);
};
