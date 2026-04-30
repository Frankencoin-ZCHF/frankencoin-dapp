import { useRouter } from "next/router";
import React, { ReactNode, useMemo } from "react";
import { track } from "@hooks";

interface PageTab {
	label: string;
	slug?: string;
	badge?: number;
	content: ReactNode;
}

interface Props {
	tabs: PageTab[];
	urlParam?: string;
	className?: string;
}

function defaultSlug(label: string): string {
	return label
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export default function PageTabInput({ tabs, urlParam = "tab", className }: Props) {
	const router = useRouter();

	const slugs = useMemo(() => tabs.map((t) => t.slug ?? defaultSlug(t.label)), [tabs]);

	const queryValue = router.query[urlParam];
	const activeSlug = Array.isArray(queryValue) ? queryValue[0] : queryValue;
	const activeFromUrl = slugs.findIndex((s) => s === activeSlug);
	const active = activeFromUrl >= 0 ? activeFromUrl : 0;

	const selectTab = (i: number) => {
		if (i === active) return;
		track("tab_" + slugs[i]);
		const nextQuery = { ...router.query, [urlParam]: slugs[i] };
		router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true, scroll: false });
	};

	return (
		<div className={className}>
			<div className="">
				<div className="flex gap-6 border-b-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
					{tabs.map((tab, i) => (
						<button
							key={i}
							onClick={() => selectTab(i)}
							className={`flex-shrink-0 flex items-center gap-2 -mb-0.5 pb-2 px-4 text-sm font-bold border-b-2 transition-colors ${
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
