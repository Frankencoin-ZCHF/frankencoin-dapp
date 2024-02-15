import { gql, useQuery } from "@apollo/client";

interface Trade {
  id: string;
  trader: string;
  amount: string;
  shares: string;
  price: string;
  time: string;
}

export const useTradeQuery = (): {
  loading: boolean;
  trades: Trade[];
} => {
  const { data, loading } = useQuery(
    gql`
      query {
        trades(orderDirection: "desc", orderBy: "time", limit: 100) {
          items {
            id
            trader
            amount
            shares
            price
            time
          }
        }
      }
    `
  );

  if (!data || !data.trades) {
    return {
      loading,
      trades: [],
    };
  }

  return {
    loading,
    trades: data.trades.items,
  };
};
