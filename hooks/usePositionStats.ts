import {
  Address,
  erc20ABI,
  useAccount,
  useChainId,
  useContractRead,
  useContractReads,
} from "wagmi";
import { decodeBigIntCall } from "@utils";
import { ABIS, ADDRESS } from "@contracts";
import { getAddress, zeroAddress } from "viem";

export const usePositionStats = (position: Address, collateral?: Address) => {
  const { address } = useAccount();
  const chainId = useChainId();

  const account = address || zeroAddress;

  const { data: collateralData } = useContractRead({
    address: position,
    abi: ABIS.PositionABI,
    functionName: "collateral",
    enabled: !collateral && position != zeroAddress,
  });

  if (!collateral && collateralData) {
    collateral = collateralData;
  }

  const { data, isSuccess } = useContractReads({
    contracts: [
      // Collateral Calls
      {
        address: collateral,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [position],
      },
      {
        address: collateral,
        abi: erc20ABI,
        functionName: "decimals",
      },
      {
        address: collateral,
        abi: erc20ABI,
        functionName: "symbol",
      },
      {
        address: collateral,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [account],
      },
      {
        address: collateral,
        abi: erc20ABI,
        functionName: "allowance",
        args: [account, ADDRESS[chainId].mintingHub],
      },
      {
        address: collateral,
        abi: erc20ABI,
        functionName: "allowance",
        args: [account, position],
      },
      // Position Calls
      {
        address: position,
        abi: ABIS.PositionABI,
        functionName: "price",
      },
      {
        address: position,
        abi: ABIS.PositionABI,
        functionName: "expiration",
      },
      {
        address: position,
        abi: ABIS.PositionABI,
        functionName: "limit",
      },
      {
        address: position,
        abi: ABIS.PositionABI,
        functionName: "minted",
      },
      {
        address: position,
        abi: ABIS.PositionABI,
        functionName: "reserveContribution",
      },
      {
        address: position,
        abi: ABIS.PositionABI,
        functionName: "owner",
      },
      {
        address: position,
        abi: ABIS.PositionABI,
        functionName: "calculateCurrentFee",
      },
      {
        address: position,
        abi: ABIS.PositionABI,
        functionName: "challengePeriod",
      },
      {
        address: position,
        abi: ABIS.PositionABI,
        functionName: "minimumCollateral",
      },
      // Frankencoin Calls
      {
        address: ADDRESS[chainId].frankenCoin,
        abi: erc20ABI,
        functionName: "allowance",
        args: [account, ADDRESS[chainId].mintingHub],
      },
      {
        address: ADDRESS[chainId].frankenCoin,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [account],
      },
    ],
    watch: true,
  });

  const collateralBal = data ? decodeBigIntCall(data[0]) : BigInt(0);
  const collateralDecimal = data ? Number(data[1].result || 0) : 0;
  const collateralSymbol = data ? String(data[2].result) : "";
  const collateralUserBal = data ? decodeBigIntCall(data[3]) : BigInt(0);
  const collateralAllowance = data ? decodeBigIntCall(data[4]) : BigInt(0);
  const collateralPosAllowance = data ? decodeBigIntCall(data[5]) : BigInt(0);

  const liqPrice = data ? decodeBigIntCall(data[6]) : BigInt(0);
  const expiration = data ? decodeBigIntCall(data[7]) : BigInt(0);
  const limit = data ? decodeBigIntCall(data[8]) : BigInt(0);
  const minted = data ? decodeBigIntCall(data[9]) : BigInt(0);
  const available = limit - minted;
  const reserveContribution = data ? decodeBigIntCall(data[10]) : BigInt(0);
  const owner = getAddress(
    data ? String(data[11].result || zeroAddress) : zeroAddress
  );
  const mintingFee = data ? decodeBigIntCall(data[12]) : BigInt(0);
  const challengePeriod = data ? decodeBigIntCall(data[13]) : BigInt(0);
  const minimumCollateral = data ? decodeBigIntCall(data[14]) : BigInt(0);

  const frankenAllowance = data ? decodeBigIntCall(data[15]) : BigInt(0);
  const frankenBalance = data ? decodeBigIntCall(data[16]) : BigInt(0);

  return {
    isSuccess,

    collateral,
    collateralBal,
    collateralDecimal,
    collateralSymbol,
    collateralUserBal,
    collateralAllowance,
    collateralPosAllowance,

    owner,
    liqPrice,
    expiration,
    limit,
    minted,
    available,
    reserveContribution,
    mintingFee,
    challengePeriod,
    minimumCollateral,

    frankenAllowance,
    frankenBalance,
  };
};
