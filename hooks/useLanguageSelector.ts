import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useEffect } from "react";

export const useLanguageSelector = () => {
	const { i18n } = useTranslation();
	const router = useRouter();
	const options = [{ value: "en" }, { value: "de" }, { value: "es" }, { value: "fr" }, { value: "it", disabled: true }];

	const handleLanguageChange = (locale: string) => {
		const { pathname, asPath, query } = router;
		router.push({ pathname, query }, asPath, { locale, scroll: false });
        localStorage.setItem("APP_LOCALE", locale);
		// Only call changeLanguage if i18n is properly initialized
		if (i18n && typeof i18n.changeLanguage === 'function') {
			i18n.changeLanguage(locale);
		}
	};

    useEffect(() => {
        if(router.isReady && i18n && typeof i18n.changeLanguage === 'function') {
            const locale = localStorage.getItem("APP_LOCALE");
            if(locale && locale !== i18n.language) {
                handleLanguageChange(locale);
            }
        }
    }, [router.isReady, i18n]);

	return { options, selectedLanguage: i18n?.language || 'en', handleLanguageChange };
};