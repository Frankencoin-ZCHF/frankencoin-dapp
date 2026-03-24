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

export default function ButtonSecondary({ size = "md", width, className, onClick, isLoading, children, disabled, error }: Props) {
	const sizeClass = size == "sm" ? "text-sm px-2 py-1 md:py-1" : "py-3";

	return (
		<>
			{error && <div className="mb-2 px-1 text-text-warning text-center">{error}</div>}
			<button
				className={`btn ${sizeClass} ${className} ${
					disabled || isLoading
						? "cursor-not-allowed bg-button-disabled text-button-textdisabled"
						: "bg-transparent border-2 border-button-disabled text-text-primary hover:border-button-default hover:bg-button-default hover:text-white"
				} ${width ?? "w-full"}`}
				onClick={(e) => !disabled && !isLoading && onClick?.(e)}
			>
				{isLoading && <LoadingSpin />}
				{children}
			</button>
		</>
	);
}
