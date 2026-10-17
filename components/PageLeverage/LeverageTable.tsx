import { useState } from "react";
import Table from "../Table";
import TableHead from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import TableRowEmpty from "../Table/TableRowEmpty";
import LeverageRow from "./LeverageRow";
import { LeverageCollateral, useLeverageCollaterals } from "@hooks";

const COLLATERAL = "Collateral";
const MAX_LEVERAGE = "Max Leverage";
const INTEREST = "Interest";
const LIQUIDITY = "Flashloan Liquidity";
const HEADERS: string[] = [COLLATERAL, MAX_LEVERAGE, INTEREST, LIQUIDITY];

function effectiveInterest(l: LeverageCollateral) {
	return l.position.annualInterestPPM / (1_000_000 - l.position.reserveContribution);
}

export default function LeverageTable() {
	const [tab, setTab] = useState<string>(MAX_LEVERAGE); // default: Max Leverage, descending
	const [reverse, setReverse] = useState<boolean>(false);

	const { list, isLoading } = useLeverageCollaterals();

	const sorted = [...list];
	if (tab === COLLATERAL || tab === LIQUIDITY) sorted.sort((a, b) => b.flashloanLiquidityChf - a.flashloanLiquidityChf);
	if (tab === MAX_LEVERAGE) sorted.sort((a, b) => b.maxLeverage - a.maxLeverage);
	if (tab === INTEREST) sorted.sort((a, b) => effectiveInterest(b) - effectiveInterest(a));
	if (reverse) sorted.reverse();

	const handleTabOnChange = (e: string) => {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			setReverse(false);
			setTab(e);
		}
	};

	return (
		<Table>
			<TableHead headers={HEADERS} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol />
			<TableBody>
				{sorted.length == 0 ? (
					<TableRowEmpty>
						{isLoading ? "Loading leverage collaterals..." : "No collateral available for leverage right now."}
					</TableRowEmpty>
				) : (
					sorted.map((l) => <LeverageRow headers={HEADERS} tab={tab} item={l} key={`LeverageRow_${l.collateral.address}`} />)
				)}
			</TableBody>
		</Table>
	);
}
