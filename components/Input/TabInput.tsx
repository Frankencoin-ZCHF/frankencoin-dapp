import { Dispatch, SetStateAction } from "react";

export interface TabInputInterface {
	tabs?: string[];
	tab?: string;
	setTab?: Dispatch<SetStateAction<string>>;
	paddingX?: string;
}

export function TabInput({ tabs = [], tab = "", setTab = () => {}, paddingX = "6" }: TabInputInterface) {
	if (tabs.length == 0) return null;

	return (
		<div className="flex flex-row justify-between text-text-secondary">
			{tabs.map((ts) => (
				<div
					key={"key_" + ts}
					className={`rounded-lg bg-card-content-primary px-${paddingX} max-md:px-4 py-2 text-sm text-center ${
						ts == tab ? "text-text-primary font-semibold" : "cursor-pointer hover:text-button-hover hover:font-semibold"
					}`}
					onClick={() => setTab(ts)}
				>
					{ts}
				</div>
			))}
		</div>
	);
}
