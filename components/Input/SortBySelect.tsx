import { faArrowDownWideShort, faArrowUpShortWide } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Select, { components } from "react-select";

type OptionEntry = {
	value: string;
	label: string;
	reverse: boolean;
};

interface SortBySelectProps {
	headers: string[];
	tab?: string;
	reverse?: boolean;
	tabOnChange?: Function;
}

export default function SortBySelect({ headers, tab, reverse = false, tabOnChange }: SortBySelectProps) {
	const options = headers.map((o): OptionEntry => {
		return { value: o, label: o, reverse };
	});
	const symbolIdx = headers.findIndex((o) => o === tab);
	const active = options[symbolIdx];

	const handleOnChange = (value: OptionEntry | null) => {
		if (value == null) return;
		if (typeof tabOnChange == "function") tabOnChange(value.value);
	};

	return (
		<div className="flex items-center rounded-lg">
			<Select
				className="w-[13rem]"
				options={options}
				defaultValue={active}
				value={active}
				onChange={handleOnChange}
				styles={{
					indicatorSeparator: () => ({
						display: "none",
					}),
					dropdownIndicator: (baseStyles) => ({
						...baseStyles,
						color: "#0f172a",
					}),
					control: (baseStyles, state) => ({
						...baseStyles,
						backgroundColor: "#F5F6F9",
						borderRadius: "0.5rem", // This makes the main control rounder
						borderWidth: "0",
						boxShadow: "none", // Remove the focus shadow
					}),
					option: (baseStyles, state) => ({
						...baseStyles,
						backgroundColor: state.data.value == tab ? "#EAEBF0" : "transparent",
						color: state.data.value == tab ? "#0f172a" : "#272B38", // text color from option menu
					}),
					singleValue: (baseStyles) => ({
						...baseStyles,
						color: "#0f172a", // text color of selected value
					}),
					menu: (baseStyles) => ({
						...baseStyles,
						backgroundColor: "#ffffff",
						borderRadius: "0.5rem", // This rounds the dropdown menu
						overflow: "hidden", // This ensures the content doesn't overflow the rounded corners
					}),
				}}
				components={{
					Option: ({ children, ...props }) => (
						<components.Option {...props}>
							<div className="flex flex-row items-center gap-2">
								{props.data.label == tab && (
									<FontAwesomeIcon
										icon={props.data.reverse ? faArrowUpShortWide : faArrowDownWideShort}
										className="cursor-pointer"
									/>
								)}
								<div className={`${props.data.label == tab ? "" : "pl-[1.85rem]"}`}>{props.data.label}</div>
							</div>
						</components.Option>
					),
					SingleValue: ({ children, ...props }) => (
						<components.SingleValue {...props}>
							<div className="flex flex-row items-center gap-2 pl-1">
								{props.data.label == tab && (
									<FontAwesomeIcon
										icon={props.data.reverse ? faArrowUpShortWide : faArrowDownWideShort}
										className="cursor-pointer"
										color="#092f62"
									/>
								)}
								<div className={`${props.data.label == tab ? "" : "pl-[1.85rem]"}`}>{props.data.label}</div>
							</div>
						</components.SingleValue>
					),
				}}
			/>
		</div>
	);
}
