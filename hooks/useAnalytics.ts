declare global {
	interface Window {
		umami?: {
			track(eventName: string, data?: Record<string, unknown>): void;
		};
	}
}

export function track(event: string, data?: Record<string, unknown>) {
	window.umami?.track(event, data);
}
