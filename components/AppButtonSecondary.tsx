import Link from "next/link";
import LoadingSpin from "./LoadingSpin";

interface Props {
	to?: string;
	isLoading?: boolean;
	className?: string;
	size?: "small" | "medium" | "large";
	disabled?: boolean;
	width?: string;
	onClick?: (e?: any) => void;
	children?: React.ReactNode;
	error?: string;
	warning?: string;
	note?: string;
	umamiEvent?: string;
}

export default function AppButtonSecondary({
	to,
	isLoading,
	className,
	size,
	disabled,
	width,
	onClick = () => {},
	children,
	error,
	warning,
	note,
	umamiEvent,
}: Props) {
	const sizeClass = size === "small" ? "px-2 py-1 md:px-3 md:py-1 text-sm" : size === "medium" ? "px-3 py-2 md:px-3 md:py-3" : "py-3";

	const btnClass = `btn ${className ?? ""} ${sizeClass} ${
		disabled || isLoading
			? "cursor-not-allowed bg-button-disabled text-button-textdisabled"
			: "bg-transparent border-2 border-button-disabled text-text-primary hover:border-button-hover hover:bg-button-hover hover:text-white"
	} ${width ?? "w-full"}`.trim();

	const button = to ? (
		<Link href={to} className={btnClass} onClick={onClick} data-umami-event={umamiEvent}>
			{children}
		</Link>
	) : (
		<button className={btnClass} onClick={(e) => !disabled && !isLoading && onClick(e)} data-umami-event={umamiEvent}>
			{isLoading && <LoadingSpin />}
			{children}
		</button>
	);

	if (!error && !warning && !note) return button;

	return (
		<div>
			{button}
			{error ? (
				<div className="flex my-2 px-3.5 text-text-warning">{error}</div>
			) : warning ? (
				<div className="flex my-2 px-3.5 text-amber-500">{warning}</div>
			) : (
				<div className="flex my-2 px-3.5">{note}</div>
			)}
		</div>
	);
}
