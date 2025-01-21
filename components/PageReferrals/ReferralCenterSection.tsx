export const ReferralCenterSection = () => {
	return (
		<div className="flex-col justify-start items-center gap-12 inline-flex">
			<div className="bg-white rounded-xl flex-col justify-start items-start flex overflow-hidden">
				<div className="self-stretch p-8 border-b border-borders-primary justify-start items-start gap-10 inline-flex">
					<div className="grow shrink basis-0 flex-col justify-center items-start gap-5 inline-flex">
						<div className="flex-col justify-start items-start gap-3 flex">
							<div>
								<div className="w-11 h-11 bg-borders-primary rounded-full flex justify-center items-center">
									<img src="/icons/chest_dark.svg" width={26} height={26} />
								</div>
							</div>
							<div className="text-text-primary text-3xl font-black leading-9 tracking-tight">
								Referral Center
							</div>
						</div>
						<div className="flex-col justify-start items-start gap-2 flex">
							<div className="flex-col justify-start items-start flex">
								<div className="text-text-label text-sm font-normal leading-tight tracking-wide">
									Share your unique referral link
								</div>
							</div>
							<div className="h-11 px-4 py-2.5 bg-borders-primary rounded-lg justify-start items-center gap-2 inline-flex overflow-hidden">
								<div className="text-text-icon text-base font-extrabold leading-normal">
									Invest to get your referral link
								</div>
							</div>
						</div>
					</div>
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
							<div className="grow shrink basis-0 text-menu-wallet-bg text-2xl font-extrabold leading-normal">
								€ 00.00
							</div>
						</div>
					</div>
					<div className="grow shrink basis-0 p-8 border-r border-borders-primary flex-col justify-start items-center gap-4 inline-flex">
						<div className="text-text-primary text-base font-medium leading-tight">Available to claim</div>
						<div className="justify-center items-center gap-2.5 inline-flex">
							<div className="grow shrink basis-0 text-menu-wallet-bg text-2xl font-extrabold leading-normal">
								€ 00.00
							</div>
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
