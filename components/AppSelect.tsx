import Select from "react-select";

export type AppSelectOption = {
	value: string;
	label: string;
};

interface Props {
	className?: string;
	options: AppSelectOption[];
	value: string;
	onChange: (value: string) => void;
}

/**
 * General-purpose dropdown for choosing one of a few options, styled to match the
 * other inputs. For sortable table headers use SortBySelect instead.
 */
export default function AppSelect({ className, options, value, onChange }: Props) {
	const active = options.find((option) => option.value === value);

	return (
		<Select
			className={className}
			options={options}
			value={active}
			onChange={(option) => option && onChange(option.value)}
			isSearchable={false}
			styles={{
				indicatorSeparator: () => ({
					display: "none",
				}),
				dropdownIndicator: (baseStyles) => ({
					...baseStyles,
					color: "#272B38",
				}),
				control: (baseStyles) => ({
					...baseStyles,
					backgroundColor: "#F5F6F9",
					borderRadius: "0.5rem",
					borderWidth: "0",
					boxShadow: "none",
					cursor: "pointer",
				}),
				option: (baseStyles, state) => ({
					...baseStyles,
					backgroundColor: state.data.value === value ? "#EAEBF0" : "transparent",
					color: "#272B38",
					cursor: "pointer",
				}),
				singleValue: (baseStyles) => ({
					...baseStyles,
					color: "#272B38",
				}),
				menu: (baseStyles) => ({
					...baseStyles,
					backgroundColor: "#ffffff",
					borderRadius: "0.5rem",
					overflow: "hidden",
				}),
			}}
		/>
	);
}
