import { useSelector } from "react-redux";
import { RootState } from "../redux/redux.store";
import { PositionQuery, PositionsState } from "../redux/slices/positions.types";
import { PriceQueryObjectArray } from "../redux/slices/prices.types";
import { Address } from "wagmi";
import TokenLogo from "./TokenLogo";
import { formatCurrency } from "../utils/format";

export function calcOverviewStats(listByCollateral: PositionQuery[][], prices: PriceQueryObjectArray) {
	const stats = [];
	for (let positions of listByCollateral) {
		const original = positions.at(0) as PositionQuery;
		const collateral = prices[original!.collateral.toLowerCase() as Address];
		const mint = prices[original!.zchf.toLowerCase() as Address];

		if (!collateral || !mint) continue;

		let balance = 0;
		let limitForClones = 0;
		let availableForClones = 0;

		for (let pos of positions) {
			balance += parseInt(pos.collateralBalance);
			if (pos.isOriginal) {
				limitForClones += parseInt(pos.limitForClones) / 10 ** pos.zchfDecimals;
				availableForClones += parseInt(pos.availableForClones) / 10 ** pos.zchfDecimals;
			}
		}

		balance = balance / 10 ** collateral.decimals;
		const valueLocked = Math.round(balance * collateral.price.usd);
		const highestZCHFPrice =
			Math.round(Math.max(...positions.map((p) => (parseInt(p.price) * 100) / 10 ** (36 - p.collateralDecimals)))) / 100;

		const collateralizedPct = Math.round((collateral.price.usd / (highestZCHFPrice * mint.price.usd)) * 10000) / 100;
		const availableForClonesPct = Math.round((availableForClones / limitForClones) * 10000) / 100;

		const minted = Math.round(limitForClones - availableForClones);
		const collateralPriceInZCHF = Math.round((collateral.price.usd / mint.price.usd) * 100) / 100;
		const worstStatus =
			collateralizedPct < 100
				? `Danger, blow ${collateralizedPct}% collaterized`
				: collateralizedPct < 150
				? `Warning, ${collateralizedPct}% collaterized`
				: `Safe, ${collateralizedPct}% collaterized`;
		const worstStatusColors = collateralizedPct < 100 ? "bg-red-500" : collateralizedPct < 150 ? "bg-orange-400" : "bg-green-500";

		stats.push({
			original,
			originals: positions.filter((pos) => pos.isOriginal),
			clones: positions.filter((pos) => pos.isClone),
			balance,
			collateral,
			mint,
			minted,
			limitForClones,
			availableForClones,
			valueLocked,
			highestZCHFPrice,
			collateralizedPct,
			availableForClonesPct,
			collateralPriceInZCHF,
			worstStatus,
			worstStatusColors,
		});
	}
	return stats;
}

export default function OverviewTVL() {
	const { loading, openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const { coingecko } = useSelector((state: RootState) => state.prices);

	if (openPositionsByCollateral.length == 0 || Object.keys(coingecko).length == 0) return <>Loading...</>;
	const stats = calcOverviewStats(openPositionsByCollateral, coingecko);

	return (
		<section className="mx-auto flex flex-col gap-y-4 px-4 sm:px-8">
			{stats.map((stat) => (
				<div key={stat.original.position} className="bg-slate-950 rounded-2xl p-8">
					<div className="grid grid-cols-3 gap-4">
						<TokenLogo currency={stat.collateral.symbol.toLowerCase()} />
						<div className="col-span-2 text-2xl font-bold mb-10">
							{stat.collateral.name} ({stat.collateral.symbol})
						</div>
					</div>

					<div className="mb-5">
						The total locked balance is{" "}
						<span className="front-bold font-semibold text-gray-300">
							{stat.balance} {stat.collateral.symbol}
						</span>{" "}
						(= {formatCurrency(stat.valueLocked.toString(), 2)} $). This locked collateral serves as the foundation for minting{" "}
						{stat.mint.name} ({stat.mint.symbol}) tokens. There are{" "}
						<span className="front-bold font-semibold text-gray-300">
							{stat.originals.length} positions opened as initial positions
						</span>
						. These represent the primary original positions created with their combined maximum limit of{" "}
						<span className="front-bold font-semibold text-gray-300">
							{formatCurrency(stat.limitForClones.toString(), 2)} {stat.mint.symbol} to mint
						</span>
						. There are{" "}
						<span className="front-bold font-semibold text-gray-300">{stat.clones.length} positions opened as clones</span> of
						an original position or one of their clones. There have been already{" "}
						<span className="front-bold font-semibold text-gray-300">
							{formatCurrency(stat.minted.toString(), 2)} {stat.mint.symbol} minted
						</span>{" "}
						from all positions, which represents{" "}
						<span className="front-bold font-semibold text-gray-300">
							{Math.round(100 - stat.availableForClonesPct)}% of the maximum minting limit
						</span>{" "}
						for this collateral.
					</div>

					<div className="mb-5">
						The highest liquidation price from all positions is{" "}
						<span className="front-bold font-semibold text-gray-300">
							{formatCurrency(stat.highestZCHFPrice.toString(), 2)} ZCHF/{stat.collateral.symbol}
						</span>{" "}
						, which represents the worst{" "}
						<span className="front-bold font-semibold text-gray-300">collateralisation of {stat.collateralizedPct}%</span> for
						this collateral. The current price of {stat.collateral.name} ({stat.collateral.symbol}) on Coingecko is{" "}
						<span className="front-bold font-semibold text-gray-300">
							{formatCurrency(stat.collateralPriceInZCHF.toString(), 2)} ZCHF/{stat.collateral.symbol}
						</span>{" "}
						or {formatCurrency(stat.collateral.price.usd.toString(), 2)} USD/{stat.collateral.symbol}.
					</div>

					<div
						className={`bg-gray-200 rounded-full text-center max-h-7 max-w-[100] text-gray-900 font-bold ${stat.worstStatusColors}`}
					>
						{stat.worstStatus}
					</div>
				</div>
			))}
		</section>
	);
}
