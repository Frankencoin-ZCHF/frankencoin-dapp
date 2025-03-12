import { useQuery, DocumentNode } from "@apollo/client";
import { MORPHOGRAPH_CLIENT } from "../app.config";

export const useMorphoQuery = (query: DocumentNode, variables?: any) => {
	return useQuery(query, {
		client: MORPHOGRAPH_CLIENT,
		variables,
	});
};
