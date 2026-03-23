import { useSelector } from "react-redux";
import { Address, parseEther } from "viem";
import { PositionQueryV2 } from "@frankencoin/api";
import { RootState } from "../redux/redux.store";
import { POSITION_BLACKLISTED } from "../app.config";

export const useBorrowPositions = () => {
	const { openPositions } = useSelector((state: RootState) => state.positions);
	const challengesPosMap = useSelector((state: RootState) => state.challenges.positions.map);

	const posV2: PositionQueryV2[] = openPositions.filter((p) => p.version == 2);

	const matchingPositions: PositionQueryV2[] = posV2.filter((position) => {
		const pid: Address = position.position.toLowerCase() as Address;
		const now = Date.now();
		if (POSITION_BLACKLISTED(pid)) {
			return false;
		} else if (position.closed || position.denied) {
			return false;
		} else if (position.start * 1000 < now && position.cooldown * 1000 > now) {
			return false;
		} else if (BigInt(position.isOriginal ? position.availableForClones : position.availableForMinting) == 0n) {
			return false;
		} else if ((challengesPosMap[pid] || []).filter((c) => c.status == "Active").length > 0) {
			return false;
		} else {
			return true;
		}
	});

	const sortedByCollateral: { [key: Address]: PositionQueryV2[] } = {};
	matchingPositions.forEach((pos) => {
		const coll = pos.collateral.toLowerCase() as Address;
		if (sortedByCollateral[coll] == undefined) sortedByCollateral[coll] = [];
		sortedByCollateral[coll].push(pos);
	});

	// One representative row per collateral: highest LTV (price), lowest interest, longest expiration.
	// Navigation targets the longest-expiration position.
	const uniqueByCollateral: { [key: Address]: PositionQueryV2 } = {};
	Object.keys(sortedByCollateral).forEach((coll) => {
		const items = sortedByCollateral[coll as Address];

		let bestLTV = items[0];
		let bestInterest = items[0];
		let bestExpiration = items[0];
		let totalAvailable = 0n;

		items.forEach((i) => {
			if (BigInt(i.price) > BigInt(bestLTV.price)) bestLTV = i;

			const effectiveRate = (BigInt(i.annualInterestPPM) * parseEther("1")) / (BigInt(1_000_000) - BigInt(i.reserveContribution));
			const bestEffectiveRate =
				(BigInt(bestInterest.annualInterestPPM) * parseEther("1")) / (BigInt(1_000_000) - BigInt(bestInterest.reserveContribution));
			if (effectiveRate < bestEffectiveRate) bestInterest = i;

			if (i.expiration > bestExpiration.expiration) bestExpiration = i;

			totalAvailable += BigInt(i.availableForClones);
		});

		uniqueByCollateral[coll as Address] = {
			...bestExpiration,
			price: bestLTV.price,
			annualInterestPPM: bestInterest.annualInterestPPM,
			reserveContribution: bestInterest.reserveContribution,
			availableForClones: String(totalAvailable),
			availableForMinting: String(totalAvailable),
			availableForPosition: String(totalAvailable),
		};
	});

	return { matchingPositions, sortedByCollateral, uniqueByCollateral };
};
