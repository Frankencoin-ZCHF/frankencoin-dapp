import { useSyncExternalStore } from "react";
import { useBlockNumber, UseBlockNumberParameters } from "wagmi";

const subscribeVisibility = (onChange: () => void) => {
	document.addEventListener("visibilitychange", onChange);
	return () => document.removeEventListener("visibilitychange", onChange);
};

/** True while the browser tab is visible. Always true during SSR. */
export function usePageVisible(): boolean {
	return useSyncExternalStore(
		subscribeVisibility,
		() => document.visibilityState !== "hidden",
		() => true
	);
}

/**
 * Drop-in replacement for wagmi's `useBlockNumber` that watches for new blocks (default: on) only while
 * the tab is visible. Hidden tabs stop polling the RPC entirely, which in turn stops every read that
 * refetches on new blocks. When the tab becomes visible again, the block number query refetches on
 * focus and watching resumes.
 */
export function useLiveBlockNumber(parameters: UseBlockNumberParameters = {}) {
	const visible = usePageVisible();
	return useBlockNumber({ ...parameters, watch: visible ? parameters.watch ?? true : false });
}
