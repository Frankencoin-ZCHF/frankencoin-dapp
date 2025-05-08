import * as React from "react";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";

export type BigNumberInputProps = {
	inputRefChild?: React.RefObject<HTMLInputElement>;
	decimals?: number;
	value: string;
	onChange?: (value: string) => void;
	autoFocus?: boolean;
	placeholder?: string;
	max?: string;
	min?: string;
	className?: string;
	disabled?: boolean;
};

export function BigNumberInput({
	inputRefChild,
	decimals = 18,
	value,
	onChange,
	autoFocus,
	placeholder = "0.00",
	max,
	min,
	className,
	disabled,
}: BigNumberInputProps) {
	const inputRefFallback = React.useRef<HTMLInputElement>(null);
	const inputRef = inputRefChild || inputRefFallback;

	const [inputValue, setInputvalue] = React.useState("0");

	// update current value
	React.useEffect(() => {
		if (value.length == 0) {
			setInputvalue("0");
		} else {
			let parseInputValue;

			try {
				parseInputValue = parseUnits(inputValue || "0", decimals);
			} catch (e) {
				console.log(e);
				// do nothing
			}

			if (!parseInputValue || !parseInputValue.eq(value)) {
				setInputvalue(formatUnits(value, decimals));
			}
		}
	}, [value, decimals, inputValue]);

	React.useEffect(() => {
		if (autoFocus && inputRef) {
			const node = inputRef.current as HTMLInputElement;
			node.focus();
		}
	}, [autoFocus, inputRef]);

	const updateValue = (event: React.ChangeEvent<HTMLInputElement>) => {
		// @dev: often copying and pasting values will include a tail space
		const value = event.currentTarget.value.split(" ").join("");

		if (value === "") {
			onChange?.(value);
			setInputvalue(value);
			return;
		}

		let newValue: BigNumber;
		try {
			newValue = parseUnits(value, decimals);
		} catch (e) {
			console.log(e);
			// don't update the input on invalid values
			return;
		}

		const invalidValue = (min && newValue.lt(min)) || (max && newValue.gt(max));
		if (invalidValue) {
			return;
		}

		setInputvalue(value);
		onChange?.(newValue.toString());
	};

	const inputProps = {
		placeholder,
		onChange: updateValue,
		type: "text",
		value: inputValue,
		className: "truncate " + className,
		autoFocus,
		disabled,
	};

	return (
		<div className="">
			<input {...inputProps} ref={inputRef} />
		</div>
	);
}
