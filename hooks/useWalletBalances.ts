import { useEffect, useMemo, useState } from "react";
import { Abi, Address, erc20Abi } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { WAGMI_CHAIN } from "../app.config";

// TODO: remove fake data
import { TOKEN_OPTIONS } from "@components/PageBorrow/LIST";

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

const getMappedResponseByAddress = (query: QueryItem[], response: any[]) => {
	const mappedResponse: Record<string, TokenBalance> = {};

	query.forEach((queryItem, i) => {
		const { address, functionName, args } = queryItem;
		const valueResponse = response[i]?.result;

		if (mappedResponse[address] === undefined)
			mappedResponse[address] = { address, symbol: "", name: "", decimals: 0, balanceOf: BigInt(0) };

		if (functionName === "allowance") {
			mappedResponse[address].allowance = mappedResponse[address].allowance ?? {};
			const contractAddress = args?.[1]; // as per ABI
			mappedResponse[address].allowance[contractAddress] = valueResponse;
			return;
		}

		// @ts-ignore
		mappedResponse[address][functionName as keyof TokenBalance] = valueResponse;
	});

	return mappedResponse;
};

const intialTokenList: TokenDescriptor[] = TOKEN_OPTIONS;

export function useWalletERC20Balances() {
	const [tokenList] = useState<TokenDescriptor[]>(intialTokenList);
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

	const { data, isLoading } = useReadContracts({
		contracts: query,
	}) ?? { data: [], isLoading: true };

	const responseMappedByAddress = useMemo(() => {
		if (isLoading) return {};
		return getMappedResponseByAddress(query, data as any[]);
	}, [query, data, isLoading]);

	return { balances: Object.values(responseMappedByAddress), balancesByAddress: responseMappedByAddress, isLoading };
}
