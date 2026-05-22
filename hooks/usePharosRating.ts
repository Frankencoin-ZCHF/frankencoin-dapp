import { useEffect, useState } from "react";
import type { PharosRating } from "../pages/api/ratings/pharos";

type Result = {
	data: PharosRating | null;
	loading: boolean;
	error: string | null;
};

export function usePharosRating(): Result {
	const [data, setData] = useState<PharosRating | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		setLoading(true);
		setError(null);

		fetch("/api/ratings/pharos", { signal: controller.signal })
			.then(async (res) => {
				const body = await res.json();
				if (!res.ok || body.status !== "success") {
					throw new Error(body?.message ?? `Request failed (${res.status})`);
				}
				setData(body.data as PharosRating);
			})
			.catch((err) => {
				if (err.name === "AbortError") return;
				setError(err instanceof Error ? err.message : "Unknown error");
				setData(null);
			})
			.finally(() => setLoading(false));

		return () => controller.abort();
	}, []);

	return { data, loading, error };
}
