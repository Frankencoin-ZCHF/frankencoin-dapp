import { gql, useQuery } from "@apollo/client";

export const useNativePSQuery = (id: string) => {
	const { data, loading } = useQuery(
		gql`
      query {
        fPS(id: "${id}") {
          id
          profits
          loss
          reserve
        }
      }
    `
	);

	if (!data || !data.fPS) {
		return {
			profit: 0n,
			loss: 0n,
		};
	}

	return {
		profit: BigInt(data.fPS.profits),
		loss: BigInt(data.fPS.loss),
	};
};
