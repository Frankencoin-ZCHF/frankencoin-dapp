import LoadingSpin from "./LoadingSpin";

interface Props {
	size?: "sm" | "md";
	className?: string;
	isLoading?: boolean;
	disabled?: boolean;
	onClick?: (e: any) => void;
	children?: React.ReactNode;
	error?: string;
	width?: string;
}

export default function Button({ size = "md", width, className, onClick, isLoading, children, disabled, error }: Props) {
	const sizeClass = size == "sm" ? "text-sm px-2 py-1 md:px-3 md:py-1" : "px-3 py-3";

	return (
		<>
			{error && <div className="mb-2 px-1 text-text-warning text-center">{error}</div>}
			<button
				className={`btn ${className} ${sizeClass} ${
					disabled || isLoading
						? "font-medium cursor-not-allowed bg-button-primary-disabled-bg text-button-primary-disabled-text"
						: "font-extrabold bg-button-primary-default-bg text-button-primary-default-text"
				} ${width ?? "w-full"}`}
				onClick={(e) => !disabled && !isLoading && onClick?.(e)}
			>
				{isLoading && <LoadingSpin />}
				{children}
			</button>
		</>
	);
}
