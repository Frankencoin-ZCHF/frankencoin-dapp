import { gql, useQuery } from "@apollo/client";
import { Address, getAddress } from "viem";

export interface PositionQuery {
  position: Address
  owner: Address
  zchf: Address
  collateral: Address
  price: bigint
}

export const usePositionLists = () => {
  const { data } = useQuery(
    gql`query {
      positions {
        id
        position
        owner
        zchf
        collateral
        price
      }
    }`
  )

  const positions: PositionQuery[] = [];
  if (data && data.positions) {

    data.positions.forEach((position: any) => {
      positions.push({
        position: getAddress(position.position),
        owner: getAddress(position.owner),
        zchf: getAddress(position.zchf),
        collateral: getAddress(position.collateral),
        price: BigInt(position.price)
      })
    })
  }

  return positions;
}