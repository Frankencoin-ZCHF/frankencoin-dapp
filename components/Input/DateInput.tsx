import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import ReactDatePicker from "react-datepicker";
import { formatDate } from "@utils";

interface Props {
	className?: string;
	label: string;
	hideMax?: boolean;
	min?: Date;
	max?: Date;
	reset?: Date;
	limit?: bigint;
	limitDigit?: bigint | number;
	limitLabel?: string;
	output?: string;
	note?: string;
	value: Date;
	onChange?: (date: Date | null) => void;
	onMin?: () => void;
	onMax?: () => void;
	onReset?: () => void;
	autoFocus?: boolean;
	disabled?: boolean;
	error?: string;
}

export default function DateInput({
	className,
	label,
	min,
	max,
	reset,
	limit = 0n,
	limitDigit = 18n,
	limitLabel,
	value,
	output,
	note,
	onChange = () => {},
	onMin = () => {},
	onMax = () => {},
	onReset = () => {},
	autoFocus,
	disabled,
	error,
}: Props) {
	return (
		<div className={className}>
			<div
				className={`group border-card-input-border ${
					disabled ? "" : "hover:border-card-input-hover"
				} focus-within:!border-card-input-focus ${
					error ? "!border-card-input-error" : ""
				} text-text-secondary border-2 rounded-lg px-3 py-1 ${disabled ? "bg-card-input-disabled" : ""}`}
			>
				<div className="flex text-card-input-label my-1">{label}</div>

				<div className="flex items-center">
					<div
						className={`flex-1 py-2 ${
							error ? "text-card-input-error" : !!value ? "text-text-primary" : "placeholder:text-card-input-empty"
						}`}
					>
						{output ? (
							<div className={`text-xl py-0 bg-transparent`}>{output}</div>
						) : (
							<ReactDatePicker
								className="-ml-2 text-xl bg-transparent"
								id="expiration-datepicker"
								selected={value}
								dateFormat={"yyyy-MM-dd"}
								onChange={(e) => !disabled && onChange?.(e)}
								disabled={disabled}
							/>
						)}
					</div>

					<div className="mr-2">
						<FontAwesomeIcon icon={faCalendarDays} className="w-6 h-6 ml-2" />
					</div>
				</div>

				{limitLabel != undefined || max != undefined || min != undefined || reset != undefined ? (
					<div className="flex flex-row gap-2 py-1">
						<div className="flex-1">
							<div className="flex flex-row gap-2">
								{limitLabel != undefined && <div className="text-text-secondary">{limitLabel}</div>}
								{limitLabel != undefined && <div className="text-text-primary truncate">{formatDate(limit)}</div>}
							</div>
						</div>

						{!disabled && max != undefined && max.getDate() != value.getDate() && (
							<div
								className="text-card-input-max cursor-pointer hover:text-card-input-focus font-extrabold"
								onClick={() => {
									if (max !== undefined) {
										onChange(max);
										onMax();
									}
								}}
							>
								Max
							</div>
						)}
						{!disabled && min != undefined && min.getDate() != value.getDate() && (
							<div
								className="text-card-input-min cursor-pointer hover:text-card-input-focus font-extrabold"
								onClick={() => {
									if (min !== undefined) {
										onChange(min);
										onMin();
									}
								}}
							>
								Min
							</div>
						)}
						{!disabled && reset != undefined && reset != value && reset != min && reset != max && (
							<div
								className="text-card-input-reset cursor-pointer hover:text-card-input-focus font-extrabold"
								onClick={() => {
									if (reset !== undefined) {
										onChange(reset);
										onReset();
									}
								}}
							>
								Reset
							</div>
						)}
					</div>
				) : null}
			</div>

			<div className="flex my-2 px-3.5 text-text-warning">{error}</div>
		</div>
	);
}
