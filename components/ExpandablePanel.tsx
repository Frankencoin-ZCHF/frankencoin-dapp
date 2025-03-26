import { useState } from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "next-i18next";

interface DetailsExpandablePanelProps {
	title: string;
	children: React.ReactNode;
}


export function ExpandablePanel({ title, children }: DetailsExpandablePanelProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="self-stretch px-4 flex flex-col bg-layout-primary rounded-xl">
			<button onClick={() => setIsExpanded(!isExpanded)} className="w-full py-3 flex justify-between items-center">
				<span className="text-base font-extrabold leading-tight">{title}</span>
				<FontAwesomeIcon
					icon={faChevronDown}
					className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
				/>
			</button>

			<div className={`grid transition-all duration-300 ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
				<div className="overflow-hidden">
					{children}
				</div>
			</div>
		</div>
	);
}
