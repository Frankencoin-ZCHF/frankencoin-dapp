import { gql } from "@apollo/client";
import { useEffect, useState } from "react";
import { Address, zeroAddress } from "viem";
import { ChainId } from "@frankencoin/zchf";
import { PONDER_CLIENT } from "../app.config";
import { fetchAllPonderPages } from "@utils";

export interface SavingsReferrerMapping {
	referrer: Address;
	balance: bigint;
	account: Address;
	chainId: ChainId;
}

const QUERY = gql`
	query ($after: String) {
		savingsReferrerMappings(where: { referrer_not: "${zeroAddress}" }, orderBy: "balance", orderDirection: "DESC", after: $after) {
			items {
				referrer
				balance
				account
				chainId
			}
			pageInfo {
				endCursor
				hasNextPage
			}
		}
	}
`;

export const useSavingsReferrerMappings = (): {
	loading: boolean;
	mappings: SavingsReferrerMapping[];
} => {
	const [mappings, setMappings] = useState<SavingsReferrerMapping[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		fetchAllPonderPages<SavingsReferrerMapping>(PONDER_CLIENT, QUERY, "savingsReferrerMappings")
			.then((items) => {
				if (cancelled) return;
				setMappings(items);
			})
			.catch((error) => {
				console.error("Failed to fetch savings referrer mappings", error);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	return { loading, mappings };
};
