import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery, PriceQueryObjectArray } from "@frankencoin/api";
import TokenLogo from "../TokenLogo";
import { formatCurrency } from "../../utils/format";
import { Address } from "viem/accounts";
import AppCard from "../AppCard";
import { formatUnits, parseUnits } from "viem";

export function calcOverviewStats(listByCollateral: PositionQuery[][], allPositions: PositionQuery[], prices: PriceQueryObjectArray) {
	const stats = [];
	for (let positions of listByCollateral) {
		const original = positions.at(0) as PositionQuery;
		const collateral = prices[original!.collateral.toLowerCase() as Address];
		const mint = prices[original!.zchf.toLowerCase() as Address];

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
			const orig = allPositions.find((p) => p.position.toLowerCase() == pos.toLowerCase());
			if (!orig) continue;
			limitForClones += BigInt(orig.limitForClones) / 10n ** BigInt(orig.zchfDecimals);
			availableForClones += BigInt(orig.availableForClones) / 10n ** BigInt(orig.zchfDecimals);
		}

		if (!collateral.price.chf || !mint.price.chf) continue;

		const valueLocked = Math.round(Number(formatUnits(balance, collateral.decimals)) * collateral.price.chf);
		const highestZCHFPrice =
			Math.round(Math.max(...positions.map((p) => (Number(p.price) * 100) / 10 ** (36 - p.collateralDecimals)))) / 100;

		const collateralizedPct = Math.round((collateral.price.chf / (highestZCHFPrice * mint.price.chf)) * 10000) / 100;
		const availableForClonesPct = Math.round((Number(availableForClones) / Number(limitForClones)) * 10000) / 100;

		// const minted = Math.round(Number(limitForClones) - Number(availableForClones));
		const collateralPriceInZCHF = Math.round((collateral.price.chf / mint.price.chf) * 100) / 100;
		const worstStatus =
			collateralizedPct < 100
				? `${collateralizedPct}% collaterized`
				: collateralizedPct < 120
				? `${collateralizedPct}% collaterized`
				: `${collateralizedPct}% collaterized`;
		const worstStatusColors = collateralizedPct < 100 ? "bg-red-300" : collateralizedPct < 120 ? "bg-blue-300" : "bg-green-300";

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
			valueLocked,
			highestZCHFPrice,
			collateralizedPct,
			availableForClonesPct,
			collateralPriceInZCHF,
			worstStatus,
			worstStatusColors,
			lowestInterestRate,
		});
	}
	return stats;
}

export default function CollateralAndPositionsOverview() {
	const { list, openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const { coingecko } = useSelector((state: RootState) => state.prices);
	const stats = calcOverviewStats(openPositionsByCollateral, list.list, coingecko).sort((a, b) => b.valueLocked - a.valueLocked);

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			{stats.map((stat) => (
				<AppCard key={stat.original.position} className="p-6">
					<div className="flex items-center gap-4 mb-6 min-h-[4rem]">
						<TokenLogo currency={stat.collateral.symbol.toLowerCase()} />
						<div className="text-2xl font-bold">{stat.collateral.name}</div>
					</div>

					<div className="flex flex-col gap-3">
						<div className="flex">
							<div className="flex-1 text-text-secondary">Total locked value</div>
							<div className="text-text-primary font-semibold">{formatCurrency(stat.valueLocked.toString(), 2)} ZCHF</div>
						</div>
						<div className="flex">
							<div className="flex-1 text-text-secondary">Total locked balance</div>
							<div className="text-text-primary font-semibold">
								{formatCurrency(formatUnits(stat.balance, stat.collateral.decimals))} {stat.collateral.symbol}
							</div>
						</div>

						<div className="flex">
							<div className="flex-1 text-text-secondary">Original positions</div>
							<div className="text-text-primary font-semibold">{stat.originals.length}</div>
						</div>

						<div className="flex">
							<div className="flex-1 text-text-secondary">Clone positions</div>
							<div className="text-text-primary font-semibold">{stat.clones.length}</div>
						</div>

						<div className="flex">
							<div className="flex-1 text-text-secondary">Minting limit</div>
							<div className="text-text-primary font-semibold">
								{formatCurrency(stat.limitForClones.toString(), 2)} {stat.mint.symbol}
							</div>
						</div>

						<div className="flex">
							<div className="flex-1 text-text-secondary">Already minted</div>
							<div className="text-text-primary font-semibold">
								{formatCurrency(formatUnits(stat.minted, 18), 2)} {stat.mint.symbol}
							</div>
						</div>

						<div className="flex">
							<div className="flex-1 text-text-secondary">Minting reserve</div>
							<div className="text-text-primary font-semibold">
								{formatCurrency(formatUnits(stat.reserve, 18), 2)} {stat.mint.symbol}
							</div>
						</div>

						<div className="flex">
							<div className="flex-1 text-text-secondary">Minting utilization</div>
							<div className="text-text-primary font-semibold">{formatCurrency(100 - stat.availableForClonesPct, 2)}%</div>
						</div>

						<div className="flex">
							<div className="flex-1 text-text-secondary">Lowerst eff. rate</div>
							<div className="text-text-primary font-semibold">{formatCurrency(stat.lowestInterestRate * 100, 2)}%</div>
						</div>

						<div className="flex">
							<div className="flex-1 text-text-secondary">Current price</div>
							<div className="text-text-primary font-semibold">
								{formatCurrency(stat.collateralPriceInZCHF.toString(), 2)} ZCHF
							</div>
						</div>

						<div className="flex">
							<div className="flex-1 text-text-secondary">Highest price</div>
							<div className="text-text-primary font-semibold">
								{formatCurrency(stat.highestZCHFPrice.toString(), 2)} ZCHF
							</div>
						</div>

						<div className="flex mt-4">
							<div className="flex-1">
								<div
									className={`bg-gray-200 rounded-full text-center py-2 px-4 text-gray-900 font-bold ${stat.worstStatusColors}`}
								>
									{stat.worstStatus}
								</div>
							</div>
						</div>
					</div>
				</AppCard>
			))}
		</div>
	);
}
