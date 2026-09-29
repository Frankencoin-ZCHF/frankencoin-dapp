import { PositionQuery, PriceQueryObjectArray } from "@frankencoin/api";
import { Address } from "viem/accounts";
import { formatUnits } from "viem";
import { formatFloat, normalizeAddress } from "./format";
import { DISCUSSIONS } from "./constant";

export function calcOverviewStats(listByCollateral: PositionQuery[][], allPositions: PositionQuery[], prices: PriceQueryObjectArray) {
	const stats = [];
	for (let positions of listByCollateral) {
		const original = positions.at(0) as PositionQuery;
		const collateral = prices[normalizeAddress(original!.collateral)];
		const mint = prices[normalizeAddress(original!.zchf)];

		if (!collateral || !mint) continue;

		let minted = 0n;
		let reserve = 0n;
		let balance = 0n;
		let limitForClones = 0n;
		let availableForClones = 0n;
		let lowestInterestRate = 0;

		for (let pos of positions) {
			balance += BigInt(pos.collateralBalance);
			minted += BigInt(pos.minted);
			reserve += (BigInt(pos.minted) * BigInt(pos.reserveContribution)) / BigInt(1_000_000);

			const effI = pos.annualInterestPPM / (1_000_000 - pos.reserveContribution);
			if (lowestInterestRate == 0 || lowestInterestRate > effI) {
				lowestInterestRate = effI;
			}
		}

		const allOriginals = positions.map((p) => p.original).reduce((a, b) => (a.includes(b) ? a : [...a, b]), [] as Address[]);

		for (let pos of allOriginals) {
			const orig = allPositions.find((p) => normalizeAddress(p.position) === normalizeAddress(pos));
			if (!orig) continue;
			limitForClones += BigInt(orig.limitForClones) / 10n ** BigInt(orig.zchfDecimals);
			availableForClones += BigInt(orig.availableForClones) / 10n ** BigInt(orig.zchfDecimals);
		}

		if (!collateral.price.chf || !mint.price.chf) continue;

		const positionData = positions.map((p) => {
			return {
				minted: formatFloat(BigInt(p.minted), 18),
				marketPrice: collateral.price?.chf || 0,
				liqPrice: formatFloat(BigInt(p.price), 36 - p.collateralDecimals),
			};
		});

		const collMul = positionData.reduce((a, b) => {
			if (b.liqPrice == 0) return a;
			return a + (b.minted * b.marketPrice) / b.liqPrice;
		}, 0);

		const avgCollateral = minted > 0 ? collMul / formatFloat(minted, 18) : 0;

		const totalValue = Math.round(Number(formatUnits(balance, collateral.decimals)) * collateral.price.chf);
		const highestZCHFPrice =
			Math.round(Math.max(...positions.map((p) => (Number(p.price) * 100) / 10 ** (36 - p.collateralDecimals)))) / 100;

		const collateralizedPct = Math.round((collateral.price.chf / (highestZCHFPrice * mint.price.chf)) * 10000) / 100;
		const availableForClonesPct = Math.round((Number(availableForClones) / Number(limitForClones)) * 10000) / 100;

		// const minted = Math.round(Number(limitForClones) - Number(availableForClones));
		const collateralPriceInZCHF = Math.round((collateral.price.chf / mint.price.chf) * 100) / 100;

		const worstStatusColors = collateralizedPct < 100 ? "red-300" : collateralizedPct < 120 ? "blue-300" : "green-300";
		const discussionLink = DISCUSSIONS[normalizeAddress(collateral.address)] ?? DISCUSSIONS["default"];

		const lockedValue = parseFloat(formatUnits(minted, 18)) * avgCollateral;
		const avgReserveRatio = positions.reduce((acc, pos) => acc + pos.reserveContribution, 0) / positions.length / 1_000_000;

		stats.push({
			original,
			originals: positions.filter((pos) => pos.isOriginal),
			clones: positions.filter((pos) => pos.isClone),
			balance,
			collateral,
			mint,
			minted,
			reserve,
			limitForClones,
			availableForClones,
			totalValue,
			avgCollateral,
			highestZCHFPrice,
			collateralizedPct,
			availableForClonesPct,
			collateralPriceInZCHF,
			worstStatusColors,
			lowestInterestRate,
			discussionLink,
			lockedValue,
			avgReserveRatio,
		});
	}
	return stats;
}
