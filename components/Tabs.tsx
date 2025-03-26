import React, { useState } from "react";
import { SectionTitle } from "@components/SectionTitle";

interface Tab {
	id: string;
	label: string;
	content: React.ReactNode;
}

interface TabsProps {
	tabs: Tab[];
	defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
	const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id);

	return (
		<div className="flex flex-col gap-6 sm:gap-4">
			<div className="flex flex-row justify-start items-center gap-9">
				{tabs.map((tab) => (
					<button key={tab.id} onClick={() => setActiveTab(tab.id)}>
						<SectionTitle
							className={`!mb-0 transition-all duration-200 ${
								activeTab === tab.id ? "text-primary" : "text-[#CED1DA] !text-[1.25rem]"
							}`}
						>
							{tab.label}
						</SectionTitle>
					</button>
				))}
			</div>
			<div>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
		</div>
	);
}
