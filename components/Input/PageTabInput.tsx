import React, { ReactNode, useState } from "react";

interface PageTab {
	label: string;
	badge?: number;
	content: ReactNode;
}

interface Props {
	tabs: PageTab[];
	className?: string;
}

export default function PageTabInput({ tabs, className }: Props) {
	const [active, setActive] = useState(0);

	return (
		<div className={className}>
			<div className="">
				<div className="flex gap-6 border-b-2">
					{tabs.map((tab, i) => (
						<button
							key={i}
							onClick={() => setActive(i)}
							className={`flex items-center gap-2 -mb-0.5 pb-2 px-4 text-sm font-bold border-b-2 transition-colors ${
								i === active
									? "border-text-primary text-text-primary"
									: "border-transparent text-text-secondary hover:text-text-primary"
							}`}
						>
							{tab.label}
							{tab.badge != null && tab.badge > 0 && (
								<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold leading-none">
									{tab.badge}
								</span>
							)}
						</button>
					))}
				</div>
			</div>

			<div className="space-y-8">{tabs[active]?.content}</div>
		</div>
	);
}
