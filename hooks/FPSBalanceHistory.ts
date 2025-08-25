import { gql } from "@apollo/client";
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

export async function FPSBalanceHistory(address: Address): Promise<FPSBalanceHistory[]> {
	const { data } = await PONDER_CLIENT.query<{
		eRC20Balances: { items: FPSBalanceHistory[] };
	}>({
		fetchPolicy: "no-cache",
		query: gql`
			query {
				eRC20Balances(
					where: { 
						chainId: 1,
						token: "0x1bA26788dfDe592fec8bcB0Eaff472a42BE341B2", 
						OR: [
							{ from: "${address.toLowerCase()}" },
							{ to: "${address.toLowerCase()}" }
						]
					},
					orderBy: "count"
					orderDirection: "desc"
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
		`,
	});

	if (!data || !data.eRC20Balances.items) {
		return [];
	}

	const list: FPSBalanceHistory[] = data.eRC20Balances.items.map((i) => ({
		count: Number(i.count),
		created: Number(i.created),
		txHash: i.txHash,
		from: i.from,
		to: i.to,
		amount: BigInt(i.amount),
		balanceFrom: BigInt(i.balanceFrom),
		balanceTo: BigInt(i.balanceTo),
	}));

	return list;
}
