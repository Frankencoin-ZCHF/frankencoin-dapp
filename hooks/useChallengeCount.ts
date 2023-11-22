import { gql, useQuery } from "@apollo/client";

export const useChallengeCount = () => {
  const { data, loading } = useQuery(
    gql`
      query {
        challenges(orderBy: status) {
          id
          challenger
        }
      }
    `,
    {
      fetchPolicy: "no-cache",
    }
  );

  let challengeCount = 0;

  if (data && data.challenges) {
    challengeCount = data.challenges.length;
  }

  return challengeCount;
};
