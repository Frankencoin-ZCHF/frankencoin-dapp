import { useEffect, useMemo, useState } from "react";
import type { XerberusEntityType, XerberusRating } from "../pages/api/ratings/list";

type Args = {
	types?: XerberusEntityType[];
};

type Result = {
	data: XerberusRating[];
	loading: boolean;
	error: string | null;
};

export function useRatings({ types }: Args): Result {
	const [data, setData] = useState<XerberusRating[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const query = useMemo(() => {
		const params = new URLSearchParams();
		if (types && types.length > 0) params.set("type", types.join(","));
		return params.toString();
	}, [types]);

	useEffect(() => {
		const controller = new AbortController();
		setLoading(true);
		setError(null);

		fetch(`/api/ratings/list${query ? `?${query}` : ""}`, { signal: controller.signal })
			.then(async (res) => {
				const body = await res.json();
				if (!res.ok || body.status !== "success") {
					throw new Error(body?.message ?? `Request failed (${res.status})`);
				}
				setData(body.data as XerberusRating[]);
			})
			.catch((err) => {
				if (err.name === "AbortError") return;
				setError(err instanceof Error ? err.message : "Unknown error");
				setData([]);
			})
			.finally(() => setLoading(false));

		return () => controller.abort();
	}, [query]);

	return { data, loading, error };
}
