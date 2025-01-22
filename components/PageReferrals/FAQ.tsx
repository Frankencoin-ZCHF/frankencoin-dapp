import { useState, ReactNode } from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ExpandableFAQ = ({ question, answer, separator = true }: { question: string; answer: string | ReactNode; separator?: boolean }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div
			onClick={() => setIsExpanded((p) => !p)}
			className={`self-stretch py-6 ${
				separator ? "border-b border-borders-secondary" : ""
			} flex-col justify-center items-start gap-2 flex`}
		>
			<div className="self-stretch justify-start items-center gap-14 inline-flex">
				<div className="grow shrink basis-0 text-text-primary text-xl font-black leading-7">{question}</div>
				<FontAwesomeIcon
					icon={faChevronDown}
					className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
				/>
			</div>
			<div
				className={`self-stretch pl-8 pr-32 justify-start items-center gap-14 inline-flex overflow-hidden transition-all duration-300 ${
					isExpanded ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
				}`}
			>
				<div className="grow shrink basis-0 text-text-label text-xl leading-7">{answer}</div>
			</div>
		</div>
	);
};

export const FAQ = () => {
	return (
		<div className="flex flex-col gap-4">
			<div className="text-text-primary text-2xl font-black leading-7">Q&A</div>
			<div className="px-12 py-4 bg-white rounded-xl border border-borders-primary flex-col justify-start items-start inline-flex">
				<ExpandableFAQ
					question="Who is entitled to participate in the referral system?"
					answer="Everyone who has interacted with the dEuro Protocol once is authorized and receives their referral code."
				/>
				<ExpandableFAQ
					question="Is there a limit to how many referrals I can earn bonus for?"
					answer="No, there are no limits to how many referrals you can do."
				/>
				<ExpandableFAQ
					question="How do I join the referral program?"
					answer="Every user who accesses the dEURO Protocol for the first time via your referral link counts as one of your referred users. The number of successful referrals depends on the number of recommended accounts via your referral link with an initial invest in the dEURO Protocol."
				/>
				<ExpandableFAQ
					question="How and how often will I be paid?"
					answer={
						<div className="text-text-label text-xl leading-7 flex flex-col gap-4">
							<span>The Protocol automatically pays out for your referred customers in dEURO.</span>
							<div>
								<span>Your referral uses:</span>
								<ul className="list-disc pl-6 mt-2 ml-2">
									<li>the Borrow module - direct payout</li>
									<li>the Savings module - pro rata, daily payout</li>
									<li>the Equity module - direct payout</li>
								</ul>
							</div>
							<span>
								In addition, there are sign-up bonuses which are paid out directly as soon as the referrer invests in the
								Saving, Equity or Borrow module of the dEURO protocol for the first time.
							</span>
							<span>Your referral bonus can be claimed by you at any time</span>
						</div>
					}
				/>
				<ExpandableFAQ
					question="How do I receive my referral bonus?"
					answer="Your bonuses paid out by the system are collected and are available to you at any time. To do this, you must actively claim the bonus."
				/>
				<ExpandableFAQ
					question="If my friend forgets to use the referral link or code, can I still receive the bonus?"
					answer="Regrettably, without the use of a referral code or link, we are unable to add any referral bonus to your account."
					separator={false}
				/>
			</div>
		</div>
	);
};
