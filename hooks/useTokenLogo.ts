import axios from "axios";
import { useEffect, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";

export const useTokenLogo = (symbol: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [logo, setLogo] = useLocalStorage(symbol);

  useEffect(() => {
    const value = localStorage.getItem(symbol);
    if (!value) {
      if (isLoading) return;

      const fetchData = async () => {
        try {
          console.log("Loading logos from CoinMarketCap");
          setIsLoading(true);
          const data = await fetch(
            `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?symbol=XCHF,LsETH,USDAPa&skip_invalid=true`,
            {
              mode: "no-cors",
              headers: {
                "X-CMC_PRO_API_KEY": "fd577e69-38de-444e-a681-594a286bfc98",
              },
            }
          );
          console.log("here", data, await data.json());
          // const data = await axios.get(
          //   `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?symbol=${symbol}?skip_invalid=true`,
          //   {
          //     headers: {
          //       "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY,
          //       "Access-Control-Allow-Origin": "http://frankencoin.com",
          //     },
          //   }
          // );
          // const marketInfos = data.data;
          // Object.keys(marketInfos).map((symbol) => {
          //   const market = marketInfos[symbol][0];
          //   const logo = market.logo;
          //   setLogo(logo);
          // });
        } catch {}
      };

      fetchData();
    }
  }, [isLoading, symbol, setLogo]);

  return logo;
};
