import { useState } from "react";
import Image from "next/image";
import Button from "@components/Button";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "next-i18next";

const ExplanationItem = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
	<div className="max-w-[28rem] justify-start items-start gap-3 flex">
		<div>
			<Image src={icon} width={42} height={42} alt={title} />
		</div>
		<div className="grow shrink basis-0 flex-col justify-center items-start">
			<div className="self-stretch text-base font-extrabold leading-tight">{title}</div>
			<div className="mt-1 self-stretch text-sm font-normal leading-[16px]">{description}</div>
		</div>
	</div>
);

export const MyInvestmentSection = () => {
	const { t } = useTranslation();

	return (
		<div className="self-stretch p-4 sm:p-8 sm:gap-10 border-b border-borders-primary flex justify-between flex-col sm:flex-row">
			<div className="self-stretch flex-col justify-start items-start gap-5 inline-flex sm:w-1/2">
				<div className="flex-col justify-start items-start gap-3 flex">
					<div>
						<Image src="/icons/my-investments.svg" width={42} height={42} alt="My Investments" />
					</div>
					<div className="text-text-primary text-2xl sm:text-4xl font-black !leading-none">{t("dashboard.my_investments")}</div>
				</div>
			</div>
			<div className="my-6 sm:pr-7 sm:my-0 self-stretch flex-col justify-start items-start gap-5 flex sm:w-1/2">
				<ExplanationItem
					icon="/icons/save.svg"
					title={t("dashboard.take_loans")}
					description={t("dashboard.take_loans_description")}
				/>
				<ExplanationItem
					icon="/icons/percent.svg"
					title={t("dashboard.earn_interest")}
					description={t("dashboard.earn_interest_description")}
				/>
				<ExplanationItem
					icon="/icons/grow.svg"
					title={t("dashboard.benefit_from_protocol")}
					description={t("dashboard.benefit_from_protocol_description")}
				/>
			</div>
		</div>
	);
};
