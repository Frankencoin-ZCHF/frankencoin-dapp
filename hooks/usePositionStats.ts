import { Address, erc20ABI, useContractRead, useContractReads } from "wagmi"
import { decodeBigIntCall } from "../utils"
import { ABIS } from "../contracts"
import { getAddress, zeroAddress } from "viem"

export const usePositionStats = (position: Address, collateral?: Address) => {

  const { data: collateralData } = useContractRead({
    address: position,
    abi: ABIS.PositionABI,
    functionName: 'collateral',
    enabled: !collateral
  })

  if (!collateral && collateralData) {
    collateral = collateralData
  }

  const { data, isSuccess } = useContractReads({
    contracts: [
      // Collateral Calls
      {
        address: collateral,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [position]
      }, {
        address: collateral,
        abi: erc20ABI,
        functionName: 'decimals',
      }, {
        address: collateral,
        abi: erc20ABI,
        functionName: 'symbol',
      },
      // Position Calls
      {
        address: position,
        abi: ABIS.PositionABI,
        functionName: 'price'
      }, {
        address: position,
        abi: ABIS.PositionABI,
        functionName: 'expiration'
      }, {
        address: position,
        abi: ABIS.PositionABI,
        functionName: 'limit'
      }, {
        address: position,
        abi: ABIS.PositionABI,
        functionName: 'minted'
      }, {
        address: position,
        abi: ABIS.PositionABI,
        functionName: 'reserveContribution'
      }, {
        address: position,
        abi: ABIS.PositionABI,
        functionName: 'owner'
      }, {
        address: position,
        abi: ABIS.PositionABI,
        functionName: 'calculateCurrentFee'
      }
    ]
  })

  const collateralBal = data ? decodeBigIntCall(data[0]) : BigInt(0);
  const collateralDecimal = data ? Number(data[1].result || 0) : 0;
  const collateralSymbol = data ? String(data[2].result) : '';

  const liqPrice = data ? decodeBigIntCall(data[3]) : BigInt(0);
  const expiration = data ? decodeBigIntCall(data[4]) : BigInt(0);
  const limit = data ? decodeBigIntCall(data[5]) : BigInt(0);
  const minted = data ? decodeBigIntCall(data[6]) : BigInt(0);
  const available = limit - minted;
  const reserveContribution = data ? decodeBigIntCall(data[7]) : BigInt(0);
  const owner = getAddress(data ? String(data[8].result) : zeroAddress);
  const mintingFee = data ? decodeBigIntCall(data[9]) : BigInt(0);

  return {
    isSuccess,

    collateralBal,
    collateralDecimal,
    collateralSymbol,

    owner,
    liqPrice,
    expiration,
    limit,
    minted,
    available,
    reserveContribution,
    mintingFee
  }
}