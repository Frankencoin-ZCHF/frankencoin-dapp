import Link from "next/link";
import AppIcon from "./AppIcon";
import LoadingSpin from "./LoadingSpin";
import { track } from "../hooks/useAnalytics";

interface Props {
	to?: string;
	isLoading?: boolean;
	loading?: boolean;
	className?: string;
	icon?: string;
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

export default function AppButton({
	to,
	isLoading,
	loading,
	icon,
	className,
	size = "medium",
	disabled,
	width,
	onClick = () => {},
	children,
	error,
	warning,
	note,
	umamiEvent,
}: Props) {
	const busy = isLoading || loading;
	const sizeClass = size === "small" ? "px-2 py-1 md:px-3 md:py-1 text-sm" : size === "medium" ? "py-2" : "py-3";

	const btnClass = `btn ${className ?? ""} ${sizeClass} ${
		disabled || busy
			? "cursor-not-allowed bg-button-disabled text-button-textdisabled"
			: "bg-button-default text-white hover:bg-button-hover"
	} ${width ?? "w-full"}`.trim();

	const button = to ? (
		<Link
			href={to}
			className={btnClass}
			onClick={(e) => {
				onClick(e);
				if (umamiEvent) track(umamiEvent);
			}}
		>
			{children}
		</Link>
	) : (
		<button className={btnClass} onClick={(e) => !disabled && !busy && onClick(e)} data-umami-event={umamiEvent}>
			{busy && <LoadingSpin />}
			{!busy && icon && <AppIcon src={icon} size="small" />}
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
