import { useSelector } from "react-redux";
import { RootState, store } from "../redux/redux.store";
import { toggleExpertMode } from "../redux/slices/globalPreferences.slice";
import { useTranslation } from "next-i18next";

export const ExpertModeToogle = () => {
	const { t } = useTranslation();
	const expertMode = useSelector((state: RootState) => state.globalPreferences.expertMode);

	const handleToggleExpertMode = () => {
		store.dispatch(toggleExpertMode());
	};

	return (
		<label className="inline-flex items-center justify-between cursor-pointer">
			<span className="text-menu-text text-base sm:text-xl font-medium mr-2.5 leading-tight">{t("common.navbar.expert_mode")}</span>
			<input type="checkbox" value="" className="sr-only peer" checked={expertMode} onChange={handleToggleExpertMode} />
			<div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
		</label>
	);
};
