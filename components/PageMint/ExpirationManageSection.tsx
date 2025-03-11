import { DateInputOutlined } from "@components/Input/DateInputOutlined";
import { MaxButton } from "@components/Input/MaxButton";
import { DetailsExpandablePanel } from "@components/DetailsExpandablePanel";
import { useTranslation } from "next-i18next";

export const ExpirationManageSection = () => {
	const { t } = useTranslation();
	return (
		<div className="flex flex-col gap-y-8">
			<div className="flex flex-col gap-y-1.5">
				<div className="text-lg font-extrabold leading-[1.4375rem]">{t("mint.current_expiration_date")}</div>
				<DateInputOutlined
					value={null}
					placeholderText={new Date().toISOString().split("T")[0]}
					className="placeholder:text-[#5D647B]"
					onChange={() => {}}
					rightAdornment={<MaxButton className="h-full py-3.5 px-3" onClick={() => {}} label={t("mint.extend_roll_borrowing")} />}
				/>
				<span className="text-xs font-medium leading-[1rem]">{t("mint.extend_roll_borrowing_description")}</span>
			</div>
			<DetailsExpandablePanel loanDetails={undefined} collateralPriceDeuro={0} />
		</div>
	);
};
