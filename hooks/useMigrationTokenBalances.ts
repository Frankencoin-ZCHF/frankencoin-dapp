import { useEffect, useState } from "react";
import { Address } from "viem";
import { gnosis } from "viem/chains";
import { ADDRESS, ChainIdSide } from "@frankencoin/zchf";
import { getCowLogoURI } from "@utils";

export type MigrationTokenBalance = {
	address: Address;
	symbol: string;
	name: string;
	decimals: number;
	balance: bigint;
	logoURI: string;
};

export type MigrationTokenBalancesReturn = {
	chainId: ChainIdSide;
	balances: MigrationTokenBalance[];
	isLoading: boolean;
	isError: boolean;
};

type BlockscoutTokenBalance = {
	token: {
		address_hash: string;
		symbol: string;
		name: string;
		decimals: string;
		exchange_rate: string | null;
		icon_url: string | null;
	};
	value: string;
};

// Discovers ERC-20 tokens held on Gnosis Chain via Blockscout (gnosisscan.io), rather than
// checking a fixed list. Filters out unpriced tokens (exchange_rate == null) to exclude
// airdrop-spam tokens, which consistently lack market pricing data.
export const useMigrationTokenBalances = (account?: Address): MigrationTokenBalancesReturn => {
	const chainId = gnosis.id as ChainIdSide;
	const [balances, setBalances] = useState<MigrationTokenBalance[]>([]);
	const [isLoading, setLoading] = useState(false);
	const [isError, setError] = useState(false);

	useEffect(() => {
		if (!account) {
			setBalances([]);
			return;
		}

		let cancelled = false;
		setLoading(true);
		setError(false);

		const fetcher = async () => {
			try {
				const zchf = ADDRESS[chainId].ccipBridgedFrankencoin.toLowerCase();
				const res = await fetch(`https://gnosisscan.io/api/v2/addresses/${account}/tokens?type=ERC-20`);
				if (!res.ok) throw new Error(`Blockscout request failed: ${res.status}`);
				const data: { items: BlockscoutTokenBalance[] } = await res.json();

				const priced = (data.items ?? []).filter(
					(item) => item.token.exchange_rate != null && item.token.address_hash.toLowerCase() !== zchf && BigInt(item.value) > 0n
				);

				const withLogos = await Promise.all(
					priced.map(async (item) => {
						const address = item.token.address_hash as Address;
						const cowLogo = await getCowLogoURI(address);
						return {
							address,
							symbol: item.token.symbol,
							name: item.token.name,
							decimals: Number(item.token.decimals),
							balance: BigInt(item.value),
							logoURI: cowLogo || item.token.icon_url || "",
						};
					})
				);

				if (!cancelled) setBalances(withLogos);
			} catch {
				if (!cancelled) setError(true);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		fetcher();

		return () => {
			cancelled = true;
		};
	}, [account, chainId]);

	return { chainId, balances, isLoading, isError };
};
