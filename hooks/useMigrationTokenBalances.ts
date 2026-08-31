import { useBlockNumber, useConnection, useReadContracts } from "wagmi";
import { useEffect } from "react";
import { Address, erc20Abi, zeroAddress } from "viem";
import { gnosis } from "viem/chains";
import { ChainIdSide } from "@frankencoin/zchf";
import { decodeBigIntCall, MIGRATION_TOKENS, MigrationToken } from "@utils";

export type MigrationTokenBalance = MigrationToken & {
	balance: bigint;
};

export type MigrationTokenBalancesReturn = {
	chainId: ChainIdSide;
	balances: MigrationTokenBalance[];
	isLoading: boolean;
	isError: boolean;
};

export const useMigrationTokenBalances = (overrideAccount?: Address): MigrationTokenBalancesReturn => {
	const chainId = gnosis.id as ChainIdSide;
	const { address } = useConnection();
	const account = overrideAccount || address || zeroAddress;

	const { data: blockNumber } = useBlockNumber({ chainId, watch: true });
	const { data, refetch, isError, isLoading } = useReadContracts({
		contracts: MIGRATION_TOKENS.map((token) => ({
			chainId,
			address: token.address,
			abi: erc20Abi,
			functionName: "balanceOf",
			args: [account],
		})),
	});

	useEffect(() => {
		refetch();
	}, [blockNumber]);

	const balances: MigrationTokenBalance[] = MIGRATION_TOKENS.map((token, i) => ({
		...token,
		balance: data ? decodeBigIntCall(data[i]) : 0n,
	}));

	return { chainId, balances, isLoading, isError };
};
