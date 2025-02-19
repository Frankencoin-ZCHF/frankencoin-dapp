import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

const LanguageSelector = () => {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const options = [{ value: "en" }, { value: "de" }, { value: "es" }, { value: "fr", disabled: true }, { value: "it", disabled: true }];

	const handleLanguageChange = (locale: string) => {
		const { pathname, asPath, query } = router;
		router.push({ pathname, query }, asPath, { locale });
		i18n.changeLanguage(locale);
	};

	return (
		<div className="flex flex-col gap-5 min-w-[300px] sm:min-w-[300px] md:min-w-[300px]">
			<div className="inline-flex items-center justify-between cursor-pointer w-full">
				<span className="text-base font-extrabold flex items-center">{t("common.navbar.language")}</span>
			</div>
			<div className="flex flex-row justify-start gap-2">
				{options.map((option) => (
					<button
						className={`text-[#4f566d] text-sm font-medium rounded-lg p-2 px-3  ${
							i18n.language === option.value ? "bg-menu-active-bg !font-extrabold !text-text-primary" : ""
						} ${option.disabled ? "!hover:bg-white !text-[#BDC1CE]" : "hover:text-text-primary hover:bg-menu-hover-bg"}`}
						key={option.value}
						onClick={() => handleLanguageChange(option.value)}
						disabled={option.disabled}
					>
						{option.value.toUpperCase()}
					</button>
				))}
			</div>
		</div>
	);
};

export default LanguageSelector;
