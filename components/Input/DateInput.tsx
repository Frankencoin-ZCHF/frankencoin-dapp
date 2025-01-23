import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatDateTime } from "../../utils/format";
import { faCalendarDays, faHourglassStart } from "@fortawesome/free-solid-svg-icons";
import ReactDatePicker from "react-datepicker";

interface Props {
	label: string;
	hideMax?: boolean;
	min?: number | bigint;
	max?: number | bigint;
	reset?: number | bigint;
	value: Date;
	error?: string;
	onChange?: (date: Date | null) => void;
	onMin?: () => void;
	onMax?: () => void;
	onReset?: () => void;
}

export default function DateInput({
	label,
	min,
	max,
	reset,
	value,
	error,
	onChange = () => {},
	onMin = () => {},
	onMax = () => {},
	onReset = () => {},
}: Props) {
	return (
		<div>
			<div className="mb-1 flex gap-2 px-1 text-text-secondary">
				<div className="flex-1">{label}</div>

				<div className="flex flex-row gap-2 font-semibold text-sm text-text-primary cursor-pointer">
					{max != undefined && (
						<div
							className="p-1 px-2 rounded-lg bg-card-input-max hover:bg-card-input-hover"
							onClick={() => {
								if (max !== undefined) {
									onChange(new Date(Number(max) * 1000));
									onMax();
								}
							}}
						>
							MAX
						</div>
					)}

					{min != undefined && (
						<div
							className="p-1 px-2 rounded-lg bg-card-input-min hover:bg-card-input-hover"
							onClick={() => {
								if (min !== undefined) {
									onChange(new Date(Number(min) * 1000));
									onMin();
								}
							}}
						>
							MIN
						</div>
					)}

					{reset != undefined && new Date(Number(reset) * 1000) != value && (
						<div
							className="p-1 px-2 rounded-lg bg-card-input-reset hover:bg-card-input-hover"
							onClick={() => {
								if (reset !== undefined) {
									onChange(new Date(Number(reset) * 1000));
									onReset();
								}
							}}
						>
							RESET
						</div>
					)}
				</div>
			</div>
			<div className="flex items-center rounded-lg bg-card-content-primary p-2">
				<FontAwesomeIcon icon={faHourglassStart} className="w-10 h-8 mr-2" />
				<div className="flex-1">
					<div
						className={`flex gap-1 rounded-lg p-1 bg-card-content-secondary border-2 ${
							error ? "border-text-warning" : " focus-within:border-card-input-focus"
						}`}
					>
						<ReactDatePicker
							id="expiration-datepicker"
							selected={value}
							dateFormat={"yyyy-MM-dd"}
							onChange={(e) => onChange?.(e)}
						/>
					</div>
				</div>
				<label className="hidden w-20 px-4 text-end font-bold sm:block cursor-pointer" htmlFor="expiration-datepicker">
					<FontAwesomeIcon icon={faCalendarDays} className="w-10 h-8 ml-2" />
				</label>
			</div>
			{error && <div className="mt-2 px-1 text-text-warning">{error}</div>}
		</div>
	);
}
