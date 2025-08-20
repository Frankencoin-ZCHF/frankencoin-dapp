import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery, PriceQueryObjectArray } from "@deuro/api";
import { Address, formatUnits } from "viem";
import MonitoringRow from "./MonitoringRow";
import { useState } from "react";
import { useTranslation } from "next-i18next";
import { INTERNAL_PROTOCOL_POSITIONS } from "@utils";

export default function MonitoringTable() {
	const { t } = useTranslation();
	const headers: string[] = [
		t("monitoring.collateral"),
		t("dashboard.liquidation_price"),
		t("monitoring.collateralization"),
		t("monitoring.expiration"),
	];
	const [tab, setTab] = useState<string>(headers[2]);
	const [reverse, setReverse] = useState<boolean>(true);

	const { openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const { coingecko } = useSelector((state: RootState) => state.prices);
	const matchingPositions = openPositionsByCollateral.flat();

	const sorted: PositionQuery[] = sortPositions(matchingPositions, coingecko || {}, headers, tab, reverse).filter(
		(p) => !INTERNAL_PROTOCOL_POSITIONS.includes(p.position)
	);

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			if (e === headers[1]) setReverse(true);
			else if (e === headers[2]) setReverse(true);
			else setReverse(false);

			setTab(e);
		}
	};

	return (
		<Table>
			<TableHeader
				headers={headers}
				tab={tab}
				reverse={reverse}
				tabOnChange={handleTabOnChange}
				actionCol
				headerClassNames={["text-center"]}
			/>
			<TableBody>
				{sorted.length == 0 ? (
					<TableRowEmpty>{t("monitoring.no_active_positions")}</TableRowEmpty>
				) : (
					sorted.map((pos) => <MonitoringRow headers={headers} position={pos} key={pos.position} tab={tab} />)
				)}
			</TableBody>
		</Table>
	);
}

function sortPositions(
	list: PositionQuery[],
	prices: PriceQueryObjectArray,
	headers: string[],
	tab: string,
	reverse: boolean
): PositionQuery[] {
	if (tab === headers[0]) {
		// sort for Collateral Value
		list.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const size: number = parseFloat(formatUnits(BigInt(p.collateralBalance), p.collateralDecimals));
				const price: number = prices[p.collateral.toLowerCase() as Address]?.price?.eur || 1;
				return size * price;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[1]) {
		// sort for Liquidation Price
		list.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				return Math.round((parseInt(p.virtualPrice || p.price) / 10 ** (36 - p.collateralDecimals)) * 100) / 100;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[2]) {
		// sort for coll.
		list.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const collBalancePosition: number = Math.round((parseInt(p.collateralBalance) / 10 ** p.collateralDecimals) * 100) / 100;
				const collTokenPriceMarket = prices[p.collateral.toLowerCase() as Address]?.price?.eur || 0;
				const collTokenPricePosition: number = Math.round((parseInt(p.virtualPrice || p.price) / 10 ** (36 - p.collateralDecimals)) * 100) / 100;
				const marketValueCollateral: number = collBalancePosition * collTokenPriceMarket;
				const positionValueCollateral: number = collBalancePosition * collTokenPricePosition;
				const collateralizationPercentage: number = Math.round((marketValueCollateral / positionValueCollateral) * 10000) / 100;
				return collateralizationPercentage;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[3]) {
		// sorft for Expiration
		list.sort((a, b) => {
			return b.expiration - a.expiration;
		});
	}

	return reverse ? list.reverse() : list;
}
