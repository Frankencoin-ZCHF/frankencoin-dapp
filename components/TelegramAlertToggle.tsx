import { AlertType } from "@frankencoin/api";
import { useTelegramAlerts } from "../hooks/useTelegramAlerts";

interface Props {
	type: "position" | "owner" | "collateral";
	address: string;
	label?: string;
	className?: string;
}

export default function TelegramAlertToggle({ type, address, label, className = "" }: Props) {
	const { linked, isEnabled, toggle } = useTelegramAlerts();

	if (!linked) return null;

	const overridden = isEnabled("allPositions");
	const specific = isEnabled(type as AlertType, address);
	const active = overridden || specific;

	const handleClick = () => {
		if (overridden) return;
		toggle(type as AlertType, address);
	};

	return (
		<div className={`flex items-center gap-1.5 pt-2 ${className}`}>
			<button
				onClick={handleClick}
				role="switch"
				aria-checked={active}
				title={overridden ? "Enabled via All Positions" : undefined}
				className={`relative inline-flex h-4 w-8 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none ${
					overridden
						? "bg-button-default/50 cursor-default"
						: active
						? "bg-button-default cursor-pointer"
						: "bg-card-input-border cursor-pointer"
				}`}
			>
				<span
					className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${
						active ? "translate-x-4" : "translate-x-0.5"
					}`}
				/>
			</button>
			{label && (
				<span className={`text-xs ${overridden ? "text-text-secondary" : "text-text-primary"}`}>
					{label}
					{overridden && <span className="ml-1 text-text-secondary">(all)</span>}
				</span>
			)}
		</div>
	);
}
