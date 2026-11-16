import { gql } from "@apollo/client";
import { useEffect, useState } from "react";
import { Address } from "viem";
import { ADDRESS } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import { PONDER_CLIENT } from "../app.config";
import { fetchAllPonderPages } from "../utils/ponderPagination";

export interface FPSHolder {
	account: Address;
	balance: bigint;
	updated: number;
}

// 0.001 token (18 decimals) — drops dust/zero-balance accounts, keeps every real holder
const MIN_BALANCE = "1000000000000000";

// @dev: voting power is balance x holding duration, so ranking/limiting by balance would drop
// long-held small positions that carry a large share of votes. Walk every holder instead.
const HOLDERS_QUERY = gql`
	query FPSHolders($token: String!, $minBalance: BigInt!, $after: String) {
		eRC20BalanceMappings(
			orderBy: "balance"
			orderDirection: "desc"
			where: { token: $token, balance_gt: $minBalance }
			after: $after
			limit: 1000
		) {
			items {
				account
				balance
				updated
			}
			pageInfo {
				endCursor
				hasNextPage
			}
		}
	}
`;

export const useFPSHolders = (
	token: Address = ADDRESS[mainnet.id].equity
): {
	loading: boolean;
	holders: FPSHolder[];
} => {
	const [holders, setHolders] = useState<FPSHolder[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		fetchAllPonderPages<FPSHolder>(PONDER_CLIENT, HOLDERS_QUERY, "eRC20BalanceMappings", {
			token: token.toLowerCase(),
			minBalance: MIN_BALANCE,
		})
			.then((items) => {
				if (!cancelled) setHolders(items);
			})
			.catch((e) => {
				console.error("Failed to fetch holders", e);
				if (!cancelled) setHolders([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [token]);

	return { loading, holders };
};
