import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";

export interface AppMenuItem {
	label: string;
	onClick: () => void;
	disabled?: boolean;
}

interface Props {
	items: AppMenuItem[];
	className?: string;
}

/**
 * A "..." button that opens a small dropdown menu of actions.
 */
export default function AppMenu({ items, className }: Props) {
	const [isOpen, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;
		const handleClick = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [isOpen]);

	return (
		<div className={`relative inline-block ${className ?? ""}`} ref={ref}>
			<button
				className="btn h-10 w-10 bg-button-default text-white hover:bg-button-hover rounded-lg"
				onClick={() => setOpen(!isOpen)}
				aria-label="Actions"
			>
				<FontAwesomeIcon icon={faEllipsis} className="w-5 h-5" />
			</button>

			{isOpen && (
				<div className="absolute right-0 top-full mt-1 z-40 min-w-[12rem] bg-card-body-primary rounded-lg shadow-xl border border-card-input-border py-1 text-left">
					{items.map((item) => (
						<button
							key={item.label}
							className={`block w-full text-left px-4 py-2 ${
								item.disabled
									? "text-text-secondary cursor-not-allowed"
									: "text-text-primary hover:bg-table-row-hover cursor-pointer"
							}`}
							onClick={() => {
								if (item.disabled) return;
								setOpen(false);
								item.onClick();
							}}
						>
							{item.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
