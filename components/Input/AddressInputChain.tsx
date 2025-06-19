import { useRef, useState } from "react";
import ChainBySelect from "./ChainBySelect";
import { WAGMI_CHAIN, WAGMI_CHAINS } from "../../app.config";

interface Props {
	label?: string;
	className?: string;
	placeholder?: string;
	value?: string;
	chain?: string;
	onChange?: (value: string) => void;
	onOwn?: () => void;
	onReset?: () => void;
	onChangeChain?: (value: string) => void;
	limitLabel?: string;
	own?: string;
	reset?: string;
	error?: string;
	autoFocus?: boolean;
	disabled?: boolean;
	note?: string;
}

export default function AddressInputChain({
	label,
	className,
	placeholder,
	value,
	chain = WAGMI_CHAIN.name,
	error,
	onChange = () => {},
	onOwn = () => {},
	onReset = () => {},
	onChangeChain = () => {},
	limitLabel,
	own,
	reset,
	autoFocus,
	disabled,
	note,
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleClick = () => {
		if (inputRef.current && !disabled) {
			inputRef.current.focus();
		}
	};

	return (
		<div className={className}>
			<div
				className={`group border-card-input-border hover:border-card-input-hover focus-within:!border-card-input-focus ${
					error ? "!border-card-input-error" : ""
				} text-text-secondary border-2 rounded-lg px-3 py-1 ${disabled ? "bg-card-input-disabled" : ""}`}
				onClick={handleClick}
			>
				<div className="flex text-card-input-label my-1">{label}</div>

				<div className="grid md:grid-cols-6" onClick={(e) => e.stopPropagation()}>
					<input
						ref={inputRef}
						className={`md:col-span-4 w-full py-2 text-lg text-left bg-transparent truncate ${
							error ? "text-card-input-error" : "text-text-primary"
						} ${disabled ? "bg-card-input-disabled" : ""}`}
						placeholder={placeholder}
						value={value}
						onChange={(e) => onChange?.(e.target.value)}
						disabled={disabled}
						autoFocus={autoFocus}
					/>

					<div className="md:col-span-2">
						<ChainBySelect
							chains={WAGMI_CHAINS.map((c) => c.name)}
							chain={chain}
							chainOnChange={onChangeChain}
							invertColors={disabled}
						/>
					</div>
				</div>

				{limitLabel != undefined || own != undefined || reset != undefined ? (
					<div className="flex flex-row gap-2 py-1">
						<div className="flex-1 min-w-0">
							{limitLabel != undefined && (
								<div className="flex flex-row gap-2 w-full">
									<div className="text-text-secondary flex-shrink-0">Own: {limitLabel}</div>
								</div>
							)}
						</div>

						{!disabled && own != undefined && own != value && (
							<div
								className="text-card-input-max cursor-pointer hover:text-card-input-focus font-extrabold"
								onClick={() => {
									if (own !== undefined) {
										onChange(own.toString());
										onOwn();
									}
								}}
							>
								Own
							</div>
						)}
						{!disabled && reset != undefined && reset != value && reset != own && (
							<div
								className="text-card-input-reset cursor-pointer hover:text-card-input-focus font-extrabold"
								onClick={() => {
									if (reset !== undefined) {
										onChange(reset.toString());
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

			{error ? <div className="flex my-2 px-3.5 text-text-warning">{error}</div> : <div className="flex my-2 px-3.5">{note}</div>}
		</div>
	);
}
