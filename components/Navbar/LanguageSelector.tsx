import { useTranslation } from "next-i18next";
import Select, { components } from "react-select";
import { useLanguageSelector } from "../../hooks/useLanguageSelector";

type OptionType = { value: string; label: string };


export const LanguageSelector = () => {
	const { options, selectedLanguage, handleLanguageChange } = useLanguageSelector();
	const { t } = useTranslation();

	return (
		<div className="flex flex-col gap-5 min-w-[300px] sm:min-w-[300px] md:min-w-[300px]">
			<div className="inline-flex items-center justify-between cursor-pointer w-full">
				<span className="text-base font-extrabold flex items-center">{t("common.navbar.language")}</span>
			</div>
			<div className="flex flex-row justify-start gap-2">
				{options.map((option) => (
					<button
						className={`text-[#4f566d] text-sm font-medium rounded-lg p-2 px-3  ${
							selectedLanguage === option.value ? "bg-menu-active-bg !font-extrabold !text-text-primary" : ""
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

export const LanguageSelectorDropdown = () => {
	const { options, selectedLanguage, handleLanguageChange } = useLanguageSelector();
	const { t } = useTranslation();

	const filteredOptions = options.filter((option) => !option.disabled).map((option) => ({ value: option.value, label: option.value.toUpperCase() }));
	
	return (
		<Select<OptionType>
			className="flex-1  text-base font-medium leading-tight"
			options={filteredOptions}
			defaultValue={selectedLanguage ? { value: selectedLanguage, label: selectedLanguage.toUpperCase() } : undefined}
			value={selectedLanguage ? { value: selectedLanguage, label: selectedLanguage.toUpperCase() } : undefined}
			onChange={(o) => o && handleLanguageChange(o.value)}
			styles={{
				indicatorSeparator: () => ({
					display: "none",
				}),
				dropdownIndicator: (baseStyles) => ({
					...baseStyles,
					color: "#272b37",
				}),
				control: (baseStyles, state) => ({
					...baseStyles,
					color: "#e2e8f0",
					borderRadius: "0.5rem", // This makes the main control rounder
					borderWidth: "0.5px",
					boxShadow: "none", // Remove the focus shadow
					minWidth: "6.5rem",
					height: "1.5rem",
				}),
				option: (baseStyles, state) => ({
					...baseStyles,
					backgroundColor: state.isSelected ? "#e9ebf0" : "transparent",
					color: "#272b37", // text color from option menu
					borderRadius: "0.5rem",
					fontWeight: "400",
					fontSize: "16px",
					marginTop: "2px",
					padding: "0.5625rem 0.5rem",
					"&:active": {
						backgroundColor: "#e9ebf0",
					},
				}),
				singleValue: (baseStyles) => ({
					...baseStyles,
					color: "#272b37", // text color of selected value
					paddingLeft: "6px"
				}),
				menu: (baseStyles) => ({
					...baseStyles,
					backgroundColor: "#ffffff",
					borderRadius: "0.5rem", // This rounds the dropdown menu
					overflow: "hidden", // This ensures the content doesn't overflow the rounded corners
					boxShadow: "0px 10px 22px 0px rgba(45,77,108,0.15)",
					marginTop: "0",
				}),
				input: (baseStyles) => ({
					...baseStyles,
					color: "#272b37",
					fontSize: "0",
				}),
				menuList: (base, props) => ({
					...base,
					padding: "0",
				}),
			}}
			components={{
				Menu: ({ children, ...props }) => (
					<components.Menu {...props}>
						<div className="p-1">
							{children}
						</div>
					</components.Menu>
				),
			}}
		/>
	);
};

export default LanguageSelector;
