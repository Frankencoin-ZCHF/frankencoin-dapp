import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatDate } from "../../utils/format";
import { faCalendarDays, faHourglassStart } from "@fortawesome/free-solid-svg-icons";
import ReactDatePicker from "react-datepicker";

interface Props {
	label: string;
	hideMax?: boolean;
	max: number | bigint;
	value: Date;
	error?: string;
	onChange?: (date: Date | null) => void;
}

export default function DateInput({ label, max, value, error, onChange }: Props) {
	return (
		<div>
			<div className="mb-1 flex gap-2 px-1">
				<div className="flex-1">{label}</div>
				<div>
					Limit:{" "}
					<span className="text-link cursor-pointer" onClick={() => onChange && onChange(new Date(Number(max) * 1000))}>
						{formatDate(max)}
					</span>
				</div>
			</div>
			<div className="flex items-center rounded-lg bg-card-content-primary p-2">
				<FontAwesomeIcon icon={faHourglassStart} className="w-10 h-8 mr-2" />
				<div className="flex-1">
					<div
						className={`date-input flex gap-1 rounded-lg p-1 bg-card-content-secondary border-2 ${
							error ? "border-text-warning" : " border-card-content-secondary"
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
