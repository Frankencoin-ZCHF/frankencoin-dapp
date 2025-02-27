import LoadingSpin from "./LoadingSpin";
import Link from "next/link";
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

export const SecondaryButton = ({ children, className, onClick, disabled, isLoading }: Props) => {
	const disabledClass =
		disabled || isLoading ? "cursor-not-allowed bg-button-secondary-disabled-bg text-button-secondary-disabled-text" : "";
	const hoverClass = !disabled && !isLoading ? "hover:bg-button-secondary-hover-bg hover:text-button-secondary-hover-text" : "";
	const defaultClass = !disabled && !isLoading ? "bg-button-secondary-default-bg text-button-secondary-default-text" : "";

	return (
		<button
			className={`btn text-base font-extrabold ${className} ${disabledClass} ${hoverClass} ${defaultClass}`}
			onClick={(e) => !disabled && !isLoading && onClick?.(e)}
			disabled={disabled || isLoading}
		>
			{isLoading && <LoadingSpin />}
			{children}
		</button>
	);
};

interface SecondaryLinkButtonProps extends Props {
	href: string;
}

export const SecondaryLinkButton = ({ children, className, onClick, disabled, isLoading, href }: SecondaryLinkButtonProps) => {
	return (
		<Link
			href={href}
			className={`btn text-base font-extrabold bg-button-secondary-default-bg text-button-secondary-default-text hover:bg-button-secondary-hover-bg hover:text-button-secondary-hover-text ${className}`}
			onClick={(e) => !disabled && !isLoading && onClick?.(e)}
		>
			{isLoading && <LoadingSpin />}
			{children}
		</Link>
	);
};
