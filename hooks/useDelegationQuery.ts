import { gql, useQuery } from "@apollo/client";
import { zeroAddress } from "viem";

export const useDelegationQuery = (owner: string) => {
  const { data, loading } = useQuery(
    gql`query {
      delegation(id: "${owner.toLowerCase()}") {
        id
        owner
        delegatedTo
        pureDelegatedFrom
      }
    }`
  );

  if (loading || !data || !data.delegation) {
    return {
      delegatedTo: zeroAddress,
      pureDelegatedFrom: [],
    };
  }

  return {
    delegatedTo: data.delegation.delegatedTo || zeroAddress,
    pureDelegatedFrom: data.delegation.pureDelegatedFrom,
  };
};
