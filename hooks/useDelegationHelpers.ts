import { useDelegationQuery } from "@hooks";
import { Address, zeroAddress } from "viem";

export type Delegationhelpers = {
	sender: Address;
	helpers: Address[];
};

export const useDelegationHelpers = (sender: Address | undefined = zeroAddress): Delegationhelpers => {
	sender = sender.toLowerCase() as Address;

	const { delegatees } = useDelegationQuery();

	const helpers: Address[] = [];
	const visited = new Set<Address>([sender]);

	const collect = (current: Address) => {
		const delegates = delegatees[current] || [];
		for (let addr of delegates) {
			addr = addr.toLowerCase() as Address;
			if (visited.has(addr)) continue;
			visited.add(addr);
			helpers.push(addr);
			collect(addr);
		}
	};

	collect(sender);

	return {
		sender,
		helpers,
	};
};
