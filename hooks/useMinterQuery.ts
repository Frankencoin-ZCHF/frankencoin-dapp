import { gql, useQuery } from "@apollo/client";

export const useMinterQuery = () => {
  const { data, loading } = useQuery(
    gql`
      query {
        minters(first: 1000) {
          id
          minter
          applicationPeriod
          applicationFee
          applyMessage
          applyDate
          suggestor
          denyMessage
          denyDate
          vetor
        }
      }
    `
  );

  if (!data || !data.minters) {
    return {
      loading,
      minters: [],
    };
  }

  return {
    loading,
    minters: data.minters,
  };
};
