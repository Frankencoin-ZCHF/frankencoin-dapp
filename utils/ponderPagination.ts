import { ApolloClient, DocumentNode, NormalizedCacheObject } from "@apollo/client";

type PonderPage<T> = {
	items: T[];
	pageInfo: { endCursor: string | null; hasNextPage: boolean };
};

// @dev: ponder caps a single page at 1000 items and defaults to 50 when `limit` is omitted, so any
// connection that can grow past that has to be walked with cursor pagination — see
// reporting.service.ts (api repo) for the same fix on the server side. `query` must declare an
// `$after: String` variable and select `pageInfo { endCursor hasNextPage }` alongside `items` on the
// field named by `rootField`.
export async function fetchAllPonderPages<T>(
	client: ApolloClient<NormalizedCacheObject>,
	query: DocumentNode,
	rootField: string,
	variables: Record<string, unknown> = {}
): Promise<T[]> {
	const collected: T[] = [];
	let after: string | null = null;

	do {
		const result: { data?: Record<string, PonderPage<T>> } = await client.query<Record<string, PonderPage<T>>>({
			query,
			fetchPolicy: "no-cache",
			variables: { ...variables, after },
		});

		const page = result.data?.[rootField];
		if (!page?.items) break;

		collected.push(...page.items);
		after = page.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
	} while (after);

	return collected;
}
