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
      challenges(where: {
        ${position ? `position: "${position}",` : ""}
        ${challenger ? `challenger: "${challenger}",` : ""}
        status: "Active"
      }) {
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

  return { challenges, loading };
};
