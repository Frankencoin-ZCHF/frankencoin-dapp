import { useMemo } from "react";
import { Abi, Address, erc20Abi } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { WAGMI_CHAIN } from "../app.config";


type QueryItem = {
	chainId: number;
	address: `0x${string}`;
	abi: Abi;
	functionName: string;
	args?: any[];
};

export type TokenDescriptor = {
	symbol: string;
	name: string;
	address: `0x${string}`;
	allowance?: `0x${string}`[];
};

export type TokenBalance = {
	symbol: string;
	name: string;
	address: `0x${string}`;
	decimals: number;
	balanceOf: bigint;
	allowance?: Record<string, bigint>;
};

const getMappedResponseByAddress = (query: QueryItem[], tokenList: TokenDescriptor[], response: any[]) => {
	const mappedResponse: Record<string, TokenBalance> = {};

	tokenList.forEach((token) => {
		mappedResponse[token.address] = { address: token.address, symbol: token.symbol, name: token.name, decimals: 0, balanceOf: BigInt(0), allowance: {} };

		const tokenQuery = query.filter((queryItem) => queryItem.address === token.address);
		const startIndex = query.findIndex(q => q.address === token.address);
		
		tokenQuery.forEach((queryItem, i) => {
			const { functionName, args } = queryItem;
			const valueResponse = response[startIndex + i]?.result;
			if (!valueResponse) return;
			
			if (functionName === "allowance") {
				const contractAddress = args?.[1];
				if (contractAddress) {
					// @ts-ignore
					mappedResponse[token.address].allowance[contractAddress] = valueResponse;
					return;
				}
			}

			// @ts-ignore
			mappedResponse[token.address][functionName as keyof TokenBalance] = valueResponse;
		});
	});

	return mappedResponse;
}; 

export function useWalletERC20Balances(tokenList: TokenDescriptor[] = []) {
	const { address } = useAccount();
	const chainId = WAGMI_CHAIN.id as number;

	const query = useMemo(
		() =>
			tokenList
				.map((token) => [
					{
						chainId: chainId,
						address: token.address,
						abi: erc20Abi,
						functionName: "name",
					},
					{
						chainId: chainId,
						address: token.address,
						abi: erc20Abi,
						functionName: "balanceOf",
						args: [address as Address],
					},
					{
						chainId,
						address: token.address,
						abi: erc20Abi,
						functionName: "symbol",
					},
					{
						chainId,
						address: token.address,
						abi: erc20Abi,
						functionName: "decimals",
					},
					...(token.allowance?.map((contractAddress) => ({
						chainId,
						address: token.address,
						abi: erc20Abi,
						functionName: "allowance",
						args: [address as Address, contractAddress],
					})) || []),
				])
				.flat(),
		[tokenList, address, chainId]
	);

	const { data, isLoading, refetch } = useReadContracts({
		contracts: query,
	}) ?? { data: [], isLoading: true };

	const responseMappedByAddress = useMemo(() => {
		if (isLoading) return {};
		return getMappedResponseByAddress(query, tokenList, data as any[]);
	}, [query, data, isLoading]);

	return { balances: Object.values(responseMappedByAddress), balancesByAddress: responseMappedByAddress, isLoading, refetchBalances: refetch };
}
