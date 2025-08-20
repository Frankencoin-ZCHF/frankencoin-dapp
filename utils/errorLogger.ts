import axios from 'axios';

/**
 * Logs API errors with appropriate context based on error type
 * @param error - The error object from the API call
 * @param context - Description of what was being loaded (e.g., "ecosystem data", "bids data")
 */
export function logApiError(error: unknown, context: string): void {
	if (axios.isAxiosError(error)) {
		const status = error.response?.status;
		if (status && status >= 500) {
			console.error(`Server error when loading ${context}:`, error);
		} else if (status && status >= 400) {
			console.error(`Client error when loading ${context}:`, error);
		} else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
			console.error(`Timeout when loading ${context}:`, error);
		} else if (error.code === 'ERR_NETWORK') {
			console.error(`Network error when loading ${context}:`, error);
		} else {
			console.error(`Failed to load ${context}:`, error);
		}
	} else {
		console.error(`Unexpected error when loading ${context}:`, error);
	}
}