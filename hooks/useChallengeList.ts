import { gql, useQuery } from "@apollo/client";
import { Address, getAddress } from "viem";

export interface ChallengeQuery {
  position: Address;
  challenger: Address;
  number: bigint;
  size: bigint;
  bid: bigint;
  status: string;
}

interface Props {
  position?: Address;
  challenger?: Address;
}

export const useChallengeLists = ({ position, challenger }: Props) => {
  const { data } = useQuery(
    gql`query {
      challenges(where: {
        ${position ? `position: "${position}",` : ""}
        ${challenger ? `challenger: "${challenger}",` : ""}
        status: "Active"
      }) {
        id
        challenger
        position
        size
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
    data.challenges.forEach((position: any) => {
      challenges.push({
        position: getAddress(position.position),
        challenger: getAddress(position.challenger),
        number: BigInt(position.number),
        size: BigInt(position.size),
        bid: BigInt(position.bid),
        status: position.status,
      });
    });
  }

  return challenges;
};
