import ChainLogo from "@components/ChainLogo";
import Select, { components } from "react-select";

type OptionEntry = {
	value: string;
	label: string;
	reverse: boolean;
};

interface ChainBySelectProps {
	chains: string[];
	chain: string;
	reverse?: boolean;
	chainOnChange?: Function;
	disabled?: boolean;
	invertColors?: boolean;
}

export default function ChainBySelect({
	chains,
	chain,
	reverse = false,
	chainOnChange,
	disabled = false,
	invertColors = false,
}: ChainBySelectProps) {
	const options = chains.map((o): OptionEntry => {
		return { value: o, label: o, reverse };
	});
	const symbolIdx = chains.findIndex((o) => o === chain);
	const active = options[symbolIdx];

	const handleOnChange = (value: OptionEntry | null) => {
		if (value == null) return;
		if (typeof chainOnChange == "function") chainOnChange(value.value);
	};

	return (
		<div className="flex items-center rounded-lg px-2 max-md:py-2">
			<Select
				className="-mr-3 md:w-[12rem] max-md:w-full"
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
						color: "#272B38",
					}),
					control: (baseStyles, state) => ({
						...baseStyles,
						backgroundColor: invertColors ? "#FFFFFF" : "#F5F6F9",
						borderRadius: "0.5rem", // This makes the main control rounder
						borderWidth: "0",
						boxShadow: "none", // Remove the focus shadow
					}),
					option: (baseStyles, state) => ({
						...baseStyles,
						backgroundColor: state.data.value == chain ? "#EAEBF0" : "transparent",
						color: state.data.value == chain ? "#272B38" : "#272B38", // text color from option menu
					}),
					singleValue: (baseStyles) => ({
						...baseStyles,
						color: "#272B38", // text color of selected value
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
							<div className="flex flex-row items-center gap-4">
								<ChainLogo chain={props.data.label.toLowerCase()} size={4} />
								<div className={``}>{props.data.label}</div>
							</div>
						</components.Option>
					),
					SingleValue: ({ children, ...props }) => (
						<components.SingleValue {...props}>
							<div className="flex flex-row items-center gap-4">
								<ChainLogo chain={props.data.label.toLowerCase()} size={4} />
								<div className={`truncate md:w-[6rem]`}>{props.data.label}</div>
							</div>
						</components.SingleValue>
					),
				}}
			/>
		</div>
	);
}
