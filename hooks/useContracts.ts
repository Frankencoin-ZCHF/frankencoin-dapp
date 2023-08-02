import { Contract } from "ethers"
import { ABIS } from "../contracts/abis";
import { Address } from "../contracts/address";
import { useChainId } from "./useChainId";

export const useFrankenCoinContract = () => {
  const chainId = useChainId();
  const contract = new Contract(Address[chainId].frankenCoin, ABIS.FrankenCoinABI);
  return contract;
}