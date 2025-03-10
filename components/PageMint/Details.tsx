import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "next-i18next";

export const Details = () => {
	const { t } = useTranslation();
	return (
		<div className="w-full rounded-xl p-4 flex items-center justify-between">
			<div className="flex flex-col gap-y-2">
				<span className="text-base font-extrabold leading-tight">{t("mint.details")}</span>
			</div>
			<div className="flex flex-col gap-y-2">
				<FontAwesomeIcon icon={faChevronDown} className="p-1 w-3 h-3" />
			</div>
		</div>
	);
};
