import { gql, useQuery } from "@apollo/client";

export const useFPSQuery = (id: string) => {
  const { data, loading } = useQuery(
    gql`query {
      fps(id: "${id.toLowerCase()}") {
        id
        profits
        loss
      }
    }`
  );

  if (!data || !data.fps) {
    return {
      profit: 0n,
      loss: 0n,
    };
  }

  return {
    profit: BigInt(data.fps.profits),
    loss: BigInt(data.fps.loss),
  };
};
