import { useState } from "react";
import { BigNumberInput } from "./BigNumberInput";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import TokenLogo from "@components/TokenLogo";
import { useTranslation } from "next-i18next";

interface TokenDescriptor {
	symbol: string;
	name: string;
	address: `0x${string}`;
	decimals: number;
	balanceOf?: bigint;
}

interface TokenInputSelectOutlinedProps {
	selectedToken: TokenDescriptor | null | undefined;
	onSelectTokenClick: () => void;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	isError?: boolean;
	errorMessage?: string;
	adornamentRow?: React.ReactNode;
	notEditable?: boolean;
	label?: string;
}

export function TokenInputSelectOutlined({
	value,
	onChange,
	disabled,
	selectedToken,
	onSelectTokenClick,
	isError,
	errorMessage,
	adornamentRow,
	notEditable = false,
	label,
}: TokenInputSelectOutlinedProps) {
	const [isFocused, setIsFocused] = useState(false);
	const { t } = useTranslation();

	const handleOnFocus = () => {
		setIsFocused(true);
	};

	const handleOnBlur = () => {
		setIsFocused(false);
	};

	const focusClasses =
		isFocused && !notEditable
			? "before:border-2 before:border-input-borderFocus"
			: "before:border-input-border hover:before:border-input-borderHover";

	const notEditableClasses = notEditable
		? "bg-input-bgNotEditable"
		: "border-2 border-transparent before:inset-0 before:rounded-xl before:border before:pointer-events-none before:transition-colors before:duration-200";

	return (
		<div className="w-full self-stretch">
			<div className="relative">
				<div
					className={`self-stretch p-2 rounded-xl relative flex-col justify-center items-start gap-2 flex before:absolute  ${notEditableClasses} ${focusClasses}`}
				>
					<div className="self-stretch justify-start items-center gap-3 inline-flex">
						<div className="grow h-11 px-2 py-3 bg-transparent rounded-lg justify-start items-center flex min-w-0">
							<BigNumberInput
								className={`w-full pl-0 ${
									notEditable ? "placeholder:text-text-muted2" : "placeholder:text-input-placeholder"
								} text-2xl font-medium leading-tight bg-transparent ${isError ? "!text-text-warning" : "!text-input-primary"}`}
								placeholder="0"
								value={value}
								onChange={onChange}
								decimals={selectedToken?.decimals || 18}
								disabled={disabled || notEditable}
								onFocus={handleOnFocus}
								onBlur={handleOnBlur}
							/>
						</div>
						<button
							className={`min-w-40 h-11 px-3 py-2.5 bg-input-bg rounded-lg justify-between items-center flex shrink-0 gap-1 hover:bg-button-secondary-hover-bg transition-colors duration-200 ${
								notEditable ? "border border-borders-dividerLight" : ""
							}`}
							onClick={onSelectTokenClick}
						>
							{selectedToken ? (
								<div className="flex items-center">
									<span className="flex items-center mr-1.5">
										<TokenLogo currency={selectedToken.symbol} size={5} />
									</span>
									<span className="text-lg font-medium leading-tight flex items-center">{selectedToken.symbol}</span>
								</div>
							) : (
								<div className="text-input-label text-lg font-medium leading-normal">{t("common.select_token")}</div>
							)}
							<FontAwesomeIcon icon={faChevronDown} className="w-4.5 h-4.5 relative overflow-hidden" />
						</button>
					</div>
					{adornamentRow}
				</div>
			</div>
			{((isError && errorMessage) || label) && (
				<div
					className={`mt-1.5 ${
						isError && errorMessage ? "text-text-warning" : "text-text-muted3"
					} text-xs font-medium leading-none`}
				>
					{isError && errorMessage ? errorMessage : label}
				</div>
			)}
		</div>
	);
}
