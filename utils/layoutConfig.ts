export type LayoutMode = "user" | "advanced" | "governance";

interface RouteConfig {
	to: string;
	name: string;
}

interface LayoutConfig {
	label: string;
	icon: string;
	routes: RouteConfig[];
}

export const LAYOUT_CONFIGS: Record<LayoutMode, LayoutConfig> = {
	user: {
		label: "User",
		icon: "👤",
		routes: [
			{ to: "/mint", name: "Borrow" },
			{ to: "/mypositions", name: "My Positions" },
			{ to: "/transfer", name: "Transfer" },
			{ to: "/savings", name: "Savings" },
		],
	},
	advanced: {
		label: "Advanced",
		icon: "⚙️",
		routes: [
			{ to: "/swap", name: "Swap" },
			{ to: "/mint/create", name: "Create Position" },
			{ to: "/monitoring", name: "Monitoring" },
			{ to: "/equity", name: "Equity" },
		],
	},
	governance: {
		label: "Governance",
		icon: "🏛️",
		routes: [
			{ to: "/governance", name: "Governance" },
			{ to: "/report", name: "Report" },
		],
	},
};

export function getLayoutModeForRoute(pathname: string): LayoutMode | null {
	for (const [mode, config] of Object.entries(LAYOUT_CONFIGS) as [LayoutMode, LayoutConfig][]) {
		const match = config.routes.some((route) => pathname === route.to || pathname.startsWith(route.to + "/"));
		if (match) return mode;
	}
	return null;
}
