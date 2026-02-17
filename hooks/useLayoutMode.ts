import { useState } from "react";
import { LayoutMode } from "../utils/layoutConfig";

const STORAGE_KEY = "layoutMode";
const DEFAULT_MODE: LayoutMode = "user";

function getInitialMode(): LayoutMode {
	if (typeof window === "undefined") return DEFAULT_MODE;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === "user" || stored === "advanced" || stored === "governance") return stored;
	return DEFAULT_MODE;
}

export function useLayoutMode() {
	const [mode, setMode] = useState<LayoutMode>(getInitialMode);

	function setLayoutMode(m: LayoutMode) {
		setMode(m);
		if (typeof window !== "undefined") {
			localStorage.setItem(STORAGE_KEY, m);
		}
	}

	return { mode, setLayoutMode };
}
