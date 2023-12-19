import {
  Address,
  erc20ABI,
  useAccount,
  useChainId,
  useContractReads,
} from "wagmi";
import { ADDRESS } from "@contracts";
import { decodeBigIntCall } from "@utils";
import { zeroAddress } from "viem";

export const useFaucetStats = () => {
  const chainId = useChainId();
  const { address } = useAccount();

  const account = address || "0x0";

  const calls: any[] = [];
  const mockTokens = [
    ADDRESS[chainId].xchf,
    ADDRESS[chainId].mockVids,
    ADDRESS[chainId].mockBoss,
    ADDRESS[chainId].mockRealu,
    ADDRESS[chainId].mockTbos,
    ADDRESS[chainId].mockAxelra,
    ADDRESS[chainId].mockCas,
    ADDRESS[chainId].mockDaks,
    ADDRESS[chainId].mockDqts,
    ADDRESS[chainId].mockAfs,
    ADDRESS[chainId].mockArts,
    ADDRESS[chainId].mockVrgns,
    ADDRESS[chainId].mockEggs,
    ADDRESS[chainId].mockPds,
    ADDRESS[chainId].mockVegs,
    ADDRESS[chainId].mockCfes,
    ADDRESS[chainId].mockGmcs,
    ADDRESS[chainId].mockBees,
    ADDRESS[chainId].mockDgcs,
    ADDRESS[chainId].mockCias,
    ADDRESS[chainId].mockFnls,
    ADDRESS[chainId].mockTvpls,
    ADDRESS[chainId].mockPns,
    ADDRESS[chainId].mockVeda,
    ADDRESS[chainId].mockFsags,
    ADDRESS[chainId].mockSpos,
    ADDRESS[chainId].mockEhck,
    ADDRESS[chainId].mockFdos,
    ADDRESS[chainId].mockDilys,
    ADDRESS[chainId].mockNnmls,
    ADDRESS[chainId].mockTsqp,
    ADDRESS[chainId].mockXxs,
  ];

  mockTokens.forEach((token) => {
    const contract = {
      address: token,
      abi: erc20ABI,
    };
    calls.push(
      ...[
        {
          ...contract,
          functionName: "name",
        },
        {
          ...contract,
          functionName: "symbol",
        },
        {
          ...contract,
          functionName: "balanceOf",
          args: [account],
        },
        {
          ...contract,
          functionName: "decimals",
        },
      ]
    );
  });

  // Fetch all blockchain stats in one web3 call using multicall
  const { data, isError, isLoading } = useContractReads({
    contracts: [...calls],
    watch: true,
  });

  const tokenInfo: Record<
    string,
    {
      address: Address;
      name: string;
      symbol: string;
      balance: bigint;
      decimals: bigint;
    }
  > = {};
  data &&
    mockTokens.forEach((mockToken, i) => {
      const name: string = data ? String(data[i * 4].result) : "";
      const symbol: string = data ? String(data[i * 4 + 1].result) : "";
      const balance: bigint = data
        ? decodeBigIntCall(data[i * 4 + 2])
        : BigInt(0);
      const decimals: bigint = data
        ? decodeBigIntCall(data[i * 4 + 3])
        : BigInt(0);

      tokenInfo[symbol] = {
        address: mockToken || zeroAddress,
        name,
        symbol,
        balance,
        decimals,
      };
    });

  return tokenInfo;
};
