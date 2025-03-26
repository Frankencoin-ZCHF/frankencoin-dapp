import { gql, useQuery } from "@apollo/client";

export const useNativePSQuery = (id: string) => {
	const { data, loading } = useQuery(
		gql`
      query {
        dEPS(id: "${id}") {
          id
          profits
          loss
          reserve
        }
      }
    `
	);

	if (!data || !data.dEPS) {
		return {
			profit: 0n,
			loss: 0n,
		};
	}

	return {
		profit: BigInt(data.dEPS.profits),
		loss: BigInt(data.dEPS.loss),
	};
};
