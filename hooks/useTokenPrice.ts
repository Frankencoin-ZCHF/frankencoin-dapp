import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import axios from "axios";
import { ADDRESS } from "../contracts/address";
import { mainnet } from "wagmi";
import { zeroAddress } from "viem";

export const useTokenPrice = (address: string | undefined) => {
  if (!address) address = zeroAddress;
  let addressToFetch = address.toLowerCase();
  if (address == ADDRESS[mainnet.id].frankenCoin) {
    addressToFetch = "0xb4272071ecadd69d933adcd19ca99fe80664fc08";
  }
  const [price, setPrice] = useLocalStorage(addressToFetch.toLowerCase());

  useEffect(() => {
    if (address == zeroAddress) return;
    if (price && Date.now() - (price as any).timestamp < 60 * 60 * 1000) return;
    const fetchPrice = async () => {
      try {
        console.log("Loading coingecko price");
        const price = await axios.get(
          `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addressToFetch.toLowerCase()}&vs_currencies=usd`
        );
        setPrice({
          value: price.data[addressToFetch.toLowerCase()].usd,
          timestamp: Date.now(),
        });
      } catch {}
    };
    void fetchPrice();
  });

  return (price as any)?.value || 0;
};
