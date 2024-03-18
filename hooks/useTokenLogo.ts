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
          const data = await axios.get(
            `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?symbol${symbol}?skip_invalid=true`,
            {
              headers: {
                "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY,
              },
            }
          );
          const marketInfos = data.data;
          Object.keys(marketInfos).map((symbol) => {
            const market = marketInfos[symbol][0];
            const logo = market.logo;
            setLogo(logo);
          });
        } catch {}
      };

      fetchData();
    }
  }, [isLoading, symbol, setLogo]);

  return logo;
};
