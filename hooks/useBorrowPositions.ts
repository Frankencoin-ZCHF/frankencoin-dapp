import { useSelector } from "react-redux";
import { Address, parseEther } from "viem";
import { normalizeAddress } from "../utils/format";
import { PositionQueryV2 } from "@frankencoin/api";
import { RootState } from "../redux/redux.store";
import { POSITION_BLACKLISTED } from "../app.config";

export const useBorrowPositions = () => {
	const { list } = useSelector((state: RootState) => state.positions.list);
	const challengesPosMap = useSelector((state: RootState) => state.challenges.positions.map);

	const posV2: PositionQueryV2[] = list.filter((p) => p.version == 2);

	const matchingPositions: PositionQueryV2[] = posV2.filter((position) => {
		const pid: Address = normalizeAddress(position.position);
		const now = Date.now();
		if (POSITION_BLACKLISTED(pid)) {
			return false;
		} else if (position.closed || position.denied) {
			return false;
		} else if (position.start * 1000 > now) {
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
		const coll = normalizeAddress(pos.collateral);
		if (sortedByCollateral[coll] == undefined) sortedByCollateral[coll] = [];
		sortedByCollateral[coll].push(pos);
	});

	const getEffectiveExpiration = (pos: PositionQueryV2): number => {
		if (pos.isClone) {
			const orig = list.find((p) => p.position === pos.original);
			return orig?.expiration ?? pos.expiration;
		}
		return pos.expiration;
	};

	// One representative row per collateral: highest LTV (price), lowest interest, longest expiration.
	// Navigation targets the longest-expiration position.
	const uniqueByCollateral: { [key: Address]: PositionQueryV2 } = {};
	const bestPriceByCollateral: { [key: Address]: PositionQueryV2 } = {};
	const bestInterestByCollateral: { [key: Address]: PositionQueryV2 } = {};
	const bestExpirationByCollateral: { [key: Address]: PositionQueryV2 } = {};
	const bestAvailabilityByCollateral: { [key: Address]: PositionQueryV2 } = {};

	Object.keys(sortedByCollateral).forEach((coll) => {
		const items = sortedByCollateral[coll as Address].sort((a, b) => (BigInt(b.price) > BigInt(a.price) ? 1 : -1));

		let bestPrice = items[0];
		let bestInterest = items[0];
		let bestExpiration = items[0];
		let bestAvailability = items[0];
		let totalAvailable = 0n;

		items.forEach((i) => {
			if (BigInt(i.price) > BigInt(bestPrice.price)) bestPrice = i;

			const effectiveRate = (BigInt(i.annualInterestPPM) * parseEther("1")) / (BigInt(1_000_000) - BigInt(i.reserveContribution));
			const bestEffectiveRate =
				(BigInt(bestInterest.annualInterestPPM) * parseEther("1")) / (BigInt(1_000_000) - BigInt(bestInterest.reserveContribution));
			if (effectiveRate < bestEffectiveRate) bestInterest = i;

			if (getEffectiveExpiration(i) > getEffectiveExpiration(bestExpiration)) {
				bestExpiration = i;
				if (i.price >= bestPrice.price) bestPrice = i;
			}

			if (BigInt(i.availableForClones) > BigInt(bestAvailability.availableForClones)) {
				bestAvailability = i;
				if (i.price >= bestPrice.price) bestPrice = i;
			}

			totalAvailable += BigInt(i.availableForClones);
		});

		bestPrice = { ...bestPrice, expiration: getEffectiveExpiration(bestPrice) };
		bestInterest = { ...bestInterest, expiration: getEffectiveExpiration(bestInterest) };
		bestExpiration = { ...bestExpiration, expiration: getEffectiveExpiration(bestExpiration) };
		bestAvailability = { ...bestAvailability, expiration: getEffectiveExpiration(bestAvailability) };

		bestPriceByCollateral[coll as Address] = bestPrice;
		bestInterestByCollateral[coll as Address] = bestInterest;
		bestExpirationByCollateral[coll as Address] = bestExpiration;
		bestAvailabilityByCollateral[coll as Address] = bestAvailability;

		uniqueByCollateral[coll as Address] = {
			...bestPrice,
			expiration: getEffectiveExpiration(bestExpiration),
			annualInterestPPM: bestInterest.annualInterestPPM,
			reserveContribution: bestInterest.reserveContribution,
			availableForClones: String(totalAvailable),
			availableForMinting: String(totalAvailable),
			availableForPosition: String(totalAvailable),
		};
	});

	return {
		matchingPositions,
		sortedByCollateral,
		uniqueByCollateral,
		bestPriceByCollateral,
		bestInterestByCollateral,
		bestExpirationByCollateral,
		bestAvailabilityByCollateral,

		getEffectiveExpiration,
	};
};
