import { Dispatch, SetStateAction } from "react";

export interface TabInputInterface {
	tabs?: string[];
	tab?: string;
	setTab?: Dispatch<SetStateAction<string>>;
}

export function TabInput({ tabs = [], tab = "", setTab = () => {} }: TabInputInterface) {
	if (tabs.length == 0) return null;

	return (
		<div className="bg-card-content-primary mb-5 rounded-2xl">
			<div className="flex flex-row justify-between px-6 text-text-secondary">
				{tabs.map((ts) => (
					<div
						key={"key_" + ts}
						className={`px-6 max-md:px-2 py-2 text-sm text-center ${
							ts == tab ? "text-text-primary font-semibold" : "cursor-pointer"
						}`}
						onClick={() => setTab(ts)}
					>
						{ts}
					</div>
				))}
			</div>
		</div>
	);
}
