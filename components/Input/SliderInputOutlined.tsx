import { formatUnits } from "viem";
import { BigNumberInput } from "./BigNumberInput";
import { useState } from "react";

interface SliderInputOutlinedProps {
	value: string;
	onChange: (value: string) => void;
	min: bigint;
	max: bigint;
	decimals: number;
	isError?: boolean;
	errorMessage?: string;
}

export function SliderInputOutlined({ value, onChange, min, max, decimals, isError, errorMessage }: SliderInputOutlinedProps) {
	const isOnError = isError || (value && max && BigInt(value) >= max);
	const [isFocused, setIsFocused] = useState(false);

	return (
		<div className="self-stretch relative pb-1.5">
			<div className={`self-stretch p-2 rounded-xl border-2 border-transparent relative flex-col justify-center items-start gap-2 flex before:absolute before:inset-0 before:rounded-xl before:border before:pointer-events-none before:transition-colors before:duration-200 ${
				isFocused ? "before:border-2 before:border-input-borderFocus" : "before:border-input-border hover:before:border-input-borderHover"
			}`}>
				<div className="h-18 self-stretch justify-between inline-flex flex-col sm:flex-row">
					<div className="flex-col justify-center items-start inline-flex">
						<div className="self-stretch px-2 bg-white rounded-xl flex-col justify-center items-start flex">
							<div className="h-11 self-stretch justify-start items-center gap-1 inline-flex overflow-hidden">
								<div className="text-input-placeholder text-xl leading-normal">€</div>
								<BigNumberInput
									className={`w-full pl-0 text-input-primary placeholder:text-input-placeholder text-2xl font-medium leading-tight ${
										isOnError ? "!text-text-warning" : ""
									}`}
									placeholder="0"
									value={value}
									onChange={(e) => onChange(e)}
									decimals={decimals}
									onFocus={() => setIsFocused(true)}
									onBlur={() => setIsFocused(false)}
								/>
							</div>
						</div>
						<div className="px-2 justify-start items-center gap-2.5 inline-flex">
							<div className="grow shrink basis-0 h-4 justify-start items-center gap-2 flex">
								<div className="text-input-label text-xs font-medium leading-none">$0</div>
							</div>
						</div>
					</div>
					<div className="px-3 py-4 mt-2 sm:mt-0 bg-input-bg rounded-lg flex-col justify-center items-start gap-1 inline-flex">
						<div className="self-stretch justify-start items-center gap-2 inline-flex">
							<div className="grow shrink basis-0 text-[#5c637b] text-[10px] font-extrabold leading-[9px]">MIN</div>
							<div className="text-right text-[#5c637b] text-[10px] font-extrabold leading-[9px]">MAX</div>
						</div>
						<div className="self-stretch h-1 flex"></div>
						<BigNumberInput
							placeholder="0"
							value={value}
							onChange={onChange}
							decimals={decimals}
							renderInput={(props) => (
								<input
									{...props}
									type="range"
									className={`w-full min-w-[220px] ${isOnError ? "!bg-text-warning" : ""}`}
									onFocus={() => setIsFocused(true)}
									onBlur={() => setIsFocused(false)}
									{...(min || max
										? {
												min: formatUnits(min, decimals),
												max: formatUnits(max + BigInt(1), decimals), // to allow go a bit over max
												step: formatUnits(BigInt(1), decimals),
										  }
										: {})}
								/>
							)}
						/>
						<div className="self-stretch h-1 flex"></div>
					</div>
				</div>
			</div>
			{isError && errorMessage && <div className="absolute mt-1.5 text-text-warning text-xs font-medium leading-none">{errorMessage}</div>}
		</div>
	);
}
