import { gql, useQuery } from "@apollo/client";
import { Address, getAddress } from "viem";

export interface ChallengeQuery {
  position: Address;
  challenger: Address;
  number: bigint;
  start: bigint;
  duration: bigint;
  size: bigint;
  filledSize: bigint;
  acquiredCollateral: bigint;
  bid: bigint;
  status: string;
}

interface Props {
  position?: Address;
  challenger?: Address;
}

export const useChallengeLists = ({ position, challenger }: Props) => {
  const { data, loading } = useQuery(
    gql`query {
      challenges(
        orderBy: status,
        where: {
          ${position ? `position: "${position}",` : ""}
        }
      ) {
        id
        challenger
        position
        start
        duration
        size
        filledSize
        acquiredCollateral
        number
        bid
        status
      }
    }`,
    {
      fetchPolicy: "no-cache",
    }
  );

  const challenges: ChallengeQuery[] = [];
  if (data && data.challenges) {
    data.challenges.forEach((challenge: any) => {
      challenges.push({
        position: getAddress(challenge.position),
        challenger: getAddress(challenge.challenger),
        number: BigInt(challenge.number),
        size: BigInt(challenge.size),
        filledSize: BigInt(challenge.filledSize),
        bid: BigInt(challenge.bid),
        start: BigInt(challenge.start),
        duration: BigInt(challenge.duration),
        acquiredCollateral: BigInt(challenge.acquiredCollateral),
        status: challenge.status,
      });
    });
  }

  challenges.sort((a, b) => {
    if (a.status === b.status) return a.start > b.start ? 1 : -1;
    else return a.status > b.status ? 1 : -1;
  });

  return { challenges, loading };
};
