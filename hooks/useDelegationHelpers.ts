import { useDelegationQuery } from "@hooks";
import { normalizeAddress } from "@utils";
import { Address, zeroAddress } from "viem";

export type Delegationhelpers = {
	sender: Address;
	helpers: Address[];
	supporterCount: number;
};

export type DelegateeMap = { [key: Address]: Address[] };

export const collectHelpers = (address: Address, delegatees: DelegateeMap): Address[] => {
	const visited = new Set<Address>([address]);
	const helpers: Address[] = [];
	const collect = (current: Address) => {
		for (let addr of delegatees[current] || []) {
			addr = normalizeAddress(addr);
			if (visited.has(addr)) continue;
			visited.add(addr);
			helpers.push(addr);
			collect(addr);
		}
	};
	collect(address);
	return helpers;
};

export const computeSupporterCount = (address: Address, delegatees: DelegateeMap): number =>
	collectHelpers(address, delegatees).length;

export const useDelegationHelpers = (sender: Address | undefined = zeroAddress): Delegationhelpers => {
	const { delegatees } = useDelegationQuery();
	sender = normalizeAddress(sender);

	if (sender == zeroAddress)
		return {
			sender,
			helpers: [],
			supporterCount: 0,
		};

	const helpers = collectHelpers(sender, delegatees);

	return {
		sender,
		helpers,
		supporterCount: helpers.length,
	};
};
