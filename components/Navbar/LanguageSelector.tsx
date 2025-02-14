import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { useRouter } from "next/router";

const LanguageSelector = () => {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const options = [
		{ value: "en", label: "English" },
		{ value: "es", label: "Español" },
		{ value: "de", label: "Deutsch" },
	];
	const [isOpen, setIsOpen] = useState(false);

	const handleLanguageChange = (locale: string) => {
		const { pathname, asPath, query } = router;
		router.push({ pathname, query }, asPath, { locale });
		i18n.changeLanguage(locale);
		setIsOpen(false);
	};

	return (
		<div>
			<div className="inline-flex items-center justify-between cursor-pointer w-full">
				<span className="text-menu-text flex items-center">{t("common.navbar.language")}</span>
				<button 
					className="flex flex-row gap-2 items-center"
					onClick={() => setIsOpen(!isOpen)}
				>
					<span className="text-sm text-menu-text flex items-center leading-none pt-1">{i18n.language.toUpperCase()}</span>
					<FontAwesomeIcon icon={faChevronDown} className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
				</button>
			</div>
			<div className={`transition-all duration-200 overflow-hidden ${isOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
				<div className="flex flex-row justify-between gap-2 py-2">
					{options.map((option) => (
						<button 
							className={`text-menu-text text-sm rounded-full p-2 px-3 hover:bg-menu-active-bg ${
								i18n.language === option.value ? 'bg-menu-active-bg' : ''
							}`} 
							key={option.value} 
							onClick={() => handleLanguageChange(option.value)}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
};

export default LanguageSelector;
