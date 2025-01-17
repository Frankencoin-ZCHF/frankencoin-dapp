import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MaxButton } from "./MaxButton";
import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import ReactDatePicker from "react-datepicker";

interface DateInputOutlinedProps {
	value: Date | undefined | null;
	onChange: (date: Date | null) => void;
	onMaxClick?: () => void;
	maxDate?: Date | undefined | null;
}

export function DateInputOutlined({ value, maxDate, onChange, onMaxClick }: DateInputOutlinedProps) {
	return (
		<div className="self-stretch p-2 rounded-xl border border-input-border flex-row justify-between items-center gap-2 flex">
			<ReactDatePicker
				showIcon
				toggleCalendarOnIconClick
				icon={<FontAwesomeIcon icon={faCalendarDays} className="!w-5 !h-5 !text-input-placeholder !mt-[0.1rem]" />}
				className="grow shrink basis-0 !pl-8 text-[1.375rem] font-medium align-middle leading-none placeholder:text-input-placeholder !placeholder:text-[1.375rem]"
				id="expiration-datepicker"
				placeholderText="YYYY-MM-DD"
				dateFormat={"yyyy-MM-dd"}
				selected={value}
				onChange={onChange}
				maxDate={maxDate}
			/>
			{onMaxClick && typeof onMaxClick === "function" && <MaxButton onClick={onMaxClick} />}
		</div>
	);
}
