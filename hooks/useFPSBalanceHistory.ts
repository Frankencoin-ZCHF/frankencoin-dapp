import { gql, useQuery } from "@apollo/client";
import { Address } from "viem";
import { PONDER_CLIENT } from "../app.config";

export interface FPSBalanceHistory {
	count: number;
	created: number;
	txHash: string;
	from: Address;
	to: Address;
	amount: bigint;
	balanceFrom: bigint;
	balanceTo: bigint;
}

const BALANCE_HISTORY_QUERY = gql`
	query FPSBalanceHistory($addr: String!) {
		eRC20Balances(
			where: {
				chainId: 1
				token: "0x1bA26788dfDe592fec8bcB0Eaff472a42BE341B2"
				OR: [{ from: $addr }, { to: $addr }]
			}
			orderBy: "count"
			orderDirection: "asc"
			limit: 1000
		) {
			items {
				count
				created
				txHash
				from
				to
				amount
				balanceFrom
				balanceTo
			}
		}
	}
`;

export const useFPSBalanceHistory = (address: Address): FPSBalanceHistory[] => {
	const { data } = useQuery<{ eRC20Balances: { items: FPSBalanceHistory[] } }>(BALANCE_HISTORY_QUERY, {
		client: PONDER_CLIENT,
		fetchPolicy: "no-cache",
		variables: { addr: address.toLowerCase() },
	});

	if (!data?.eRC20Balances?.items) return [];

	return data.eRC20Balances.items.map((i) => ({
		count: Number(i.count),
		created: Number(i.created),
		txHash: i.txHash,
		from: i.from,
		to: i.to,
		amount: BigInt(i.amount),
		balanceFrom: BigInt(i.balanceFrom),
		balanceTo: BigInt(i.balanceTo),
	}));
};
