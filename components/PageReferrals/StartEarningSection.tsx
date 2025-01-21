interface StepArticleProps {
	title: string;
	description: string;
	bulletPoints?: string[];
	iconSrc: string;
}

function StepArticle({ title, description, bulletPoints, iconSrc }: StepArticleProps) {
	return (
		<article className="max-w-96 p-8 rounded-xl border border-borders-secondary flex-col justify-start items-start gap-2 inline-flex overflow-hidden">
			<div className="w-14 h-14 bg-borders-primary rounded-full flex items-center justify-center">
				<img src={iconSrc} alt="" width={20} height={20} />
			</div>
			<div className="self-stretch flex-col justify-start items-start gap-2 flex">
				<div className="text-2xl font-black leading-relaxed">{title}</div>
				<div className="self-stretch gap-4 flex flex-col">
					<div className="text-base leading-tight">{description}</div>
					{bulletPoints && (
						<ul className="text-base font-extrabold leading-tight list-disc pl-6">
							{bulletPoints.map((point, index) => (
								<li key={index} className="my-2">
									{point}
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</article>
	);
}

export const StartEarningSection = () => {
	return (
		<div>
			<h1 className="text-center text-5xl font-black leading-relaxed">Start Earning with Referrals</h1>
			<span className="self-stretch flex justify-center items-center text-center text-xl leading-relaxed">
				Your 3 easy steps to spread the word and start earning money passively.
			</span>
			<section className="mt-12 flex items-stretch justify-center gap-12">
				<StepArticle
					title="Invest"
					description="To get your personal referral link you have to interact with the dEURO:"
					bulletPoints={["Borrow dEURO", "Invest in Equity (nDEPS)", "Using the Savings Module"]}
					iconSrc="/icons/1_pixelfont.svg"
				/>
				<StepArticle
					title="Share"
					description="Share your referral link with your friends, family, or followers on any of your social media channels."
					iconSrc="/icons/2_pixelfont.svg"
				/>
				<StepArticle
					title="Earn"
					description="Earn 1% of all their fees and revenues. This means: You will profit from all investments made by your referrals for an unlimited period of time! Payouts are made to your wallet in dEURO."
					iconSrc="/icons/3_pixelfont.svg"
				/>
			</section>
		</div>
	);
};
