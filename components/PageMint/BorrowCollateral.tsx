import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import TokenLogo from "@components/TokenLogo";
import { Address } from "viem/accounts";
import { formatCurrency } from "../../utils/format";
import { PositionQuery, PriceQueryObjectArray } from "@deuro/api";

export type CollateralItem = {
	collateral: {
		address: Address;
		name: string;
		symbol: string;
		decimals: number;
		price: number;
		valueUsd: number;
	};
	mint: {
		address: Address;
		name: string;
		symbol: string;
		decimals: number;
		price: number;
	};
	position: {
		originalNum: number;
		cloneNum: number;
		totalNum: number;
	};
	ratios: {
		highestLTV: number;
		highestMaturity: number;
		worstStatusColors: string;
	};
};

export function BorrowCollateralCalculate(listByCollateral: PositionQuery[][], prices: PriceQueryObjectArray): CollateralItem[] {
	const stats: CollateralItem[] = [];
	for (let positions of listByCollateral) {
		const originals: PositionQuery[] = positions.filter((pos) => pos.isOriginal);
		const original = originals.at(0);
		if (!original) continue;
		
		const collateral = prices[original.collateral.toLowerCase() as Address];
		const mint = prices[original.deuro.toLowerCase() as Address];

		if (!collateral || !mint) continue;

		let balance = 0;
		let limitForClones = 0;
		let availableForClones = 0;

		for (let pos of positions) {
			balance += parseInt(pos.collateralBalance);
			if (pos.isOriginal) {
				limitForClones += parseInt(pos.limitForClones) / 10 ** pos.deuroDecimals;
				availableForClones += parseInt(pos.availableForClones) / 10 ** pos.deuroDecimals;
			}
		}

		if (!collateral.price.usd || !mint.price.usd) continue;

		balance = balance / 10 ** collateral.decimals;
		const valueLockedUsd = Math.round(balance * collateral.price.usd);

		const originalsStats = [];
		for (let position of originals) {
			const interest: number = Math.round((position.annualInterestPPM / 10 ** 4) * 100) / 100;
			const reserve: number = Math.round((position.reserveContribution / 10 ** 4) * 100) / 100;

			const available: number = Math.round((parseInt(position.availableForClones) / 10 ** position.deuroDecimals) * 100) / 100;
			const availableK: string = formatCurrency((Math.round(available / 100) / 10).toString(), 2) + "k";
			const price: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
			const since: number = Math.round((Date.now() - position.start * 1000) / 1000 / 60 / 60 / 24);
			const maturity: number = Math.round(((position.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24) * 100) / 100;

			// effectiveLTV = liquidation price * (1 - reserve) / market price
			const effectiveLTV: number = Math.round(((price * (1 - reserve / 100)) / collateral.price.usd) * 10000) / 100;
			const effectiveInterest: number = Math.round((interest / (1 - reserve / 100)) * 100) / 100;

			originalsStats.push({
				address: position.collateral,
				name: collateral.name,
				symbol: collateral.symbol,
				decimals: collateral.decimals,
				price: collateral.price.usd,
				valueUsd: valueLockedUsd,
				available: available,
				availableK: availableK,
				liquidation: price,
				since: since,
				maturity: maturity,
				interest: interest,
				reserve: reserve,
				effectiveLTV: effectiveLTV,
				effectiveInterest: effectiveInterest,
			});
		}

		const highestLTV = Math.max(...originalsStats.map((s) => s.effectiveLTV));
		const highestMaturity = Math.max(...originalsStats.map((s) => s.maturity));
		const worstStatusColors = highestMaturity < 60 ? "bg-red-300" : highestMaturity < 30 ? "bg-blue-300" : "bg-green-300";

		stats.push({
			collateral: {
				address: original.collateral,
				name: collateral.name,
				symbol: collateral.symbol,
				decimals: collateral.decimals,
				price: collateral.price.usd,
				valueUsd: valueLockedUsd,
			},
			mint: {
				address: original.deuro,
				name: mint.name,
				symbol: mint.symbol,
				decimals: mint.decimals,
				price: mint.price.usd,
			},
			position: {
				totalNum: positions.length,
				originalNum: positions.filter((pos) => pos.isOriginal).length,
				cloneNum: positions.filter((pos) => pos.isClone).length,
			},
			ratios: {
				highestLTV,
				highestMaturity,
				worstStatusColors,
			},
		});
	}

	return stats;
}

export default function BorrowCollateral({ children }: { children?: React.ReactElement | React.ReactElement[] }) {
	const { openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const { coingecko } = useSelector((state: RootState) => state.prices);
	const stats = BorrowCollateralCalculate(openPositionsByCollateral, coingecko || {});

	if (stats.length === 0) return null;

	return (
		<div className="flex bg-card-body-primary rounded-2xl px-5 py-3 my-10 space-x-8 hide-scroll-bar">
			<div className="flex overflow-x-scroll hide-scroll-bar">
				<div className="flex flex-nowrap">
					{stats.map((c: CollateralItem, i: number) => (
						<>
							<BorrowCollateralItem item={c} key={c.collateral.address} />
							{i === stats.length - 1 ? null : <CollateralItemSeperator key={c.collateral.address} />}
						</>
					))}
				</div>
			</div>
		</div>
	);
}

export function BorrowCollateralItem({ item }: { item: CollateralItem }): React.ReactElement {
	return (
		<div className="inline-block">
			<div className="w-[20rem] h-[6rem] overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out">
				<div className="grid grid-cols-8 gap-4">
					<div className="col-span-2 w-16 h-16 max-h-16 max-w-16 rounded-xl my-auto">
						<TokenLogo currency={item.collateral.symbol.toLowerCase()} size={16} />
					</div>
					<div className="col-span-4 mt-2">
						<div className="grid grid-cols-3">
							<div className="col-span-2 text-lg font-bold text-text-header">{item.collateral.symbol}</div>
							<div className="col-span-2 text-md font-bold text-text-subheader">{item.position.originalNum} Originals</div>
							<div className="col-span-2 text-md font-bold text-text-subheader">{item.position.cloneNum} Clones</div>
						</div>
					</div>
					<div className="col-span-2 -ml-10 my-4">
						<div
							className={`mb-3 rounded-full text-center max-h-7 max-w-[100] text-text-header font-bold bg-card-body-secondary`}
						>
							{formatCurrency(item.ratios.highestLTV, 1, 1)}% LTV
						</div>
						<div
							className={`rounded-full text-center max-h-7 max-w-[100] text-gray-900 font-bold ${item.ratios.worstStatusColors}`}
						>
							{formatCurrency(item.ratios.highestMaturity, 0, 0)} days
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export function CollateralItemSeperator(): React.ReactElement {
	return <div className="bg-card-body-seperator w-[2px] h-[90%] mx-5 my-auto"></div>;
}
