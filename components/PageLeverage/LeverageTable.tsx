import { useState } from "react";
import Table from "../Table";
import TableHead from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import TableRowEmpty from "../Table/TableRowEmpty";
import LeverageRow from "./LeverageRow";
import { LeverageCollateral, useLeverageCollaterals } from "@hooks";

const HEADERS: string[] = ["Collateral", "Max Leverage", "Flashloan Liquidity", "Interest"];

function effectiveInterest(l: LeverageCollateral) {
	return l.position.annualInterestPPM / (1_000_000 - l.position.reserveContribution);
}

export default function LeverageTable() {
	const [tab, setTab] = useState<string>(HEADERS[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const { list, isLoading } = useLeverageCollaterals();

	const sorted = [...list];
	if (tab === HEADERS[0] || tab === HEADERS[2]) sorted.sort((a, b) => b.flashloanLiquidityUsd - a.flashloanLiquidityUsd);
	if (tab === HEADERS[1]) sorted.sort((a, b) => b.maxLeverage - a.maxLeverage);
	if (tab === HEADERS[3]) sorted.sort((a, b) => effectiveInterest(b) - effectiveInterest(a));
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
					<TableRowEmpty>{isLoading ? "Loading leverage collaterals..." : "No collateral available for leverage right now."}</TableRowEmpty>
				) : (
					sorted.map((l) => <LeverageRow headers={HEADERS} tab={tab} item={l} key={`LeverageRow_${l.collateral.address}`} />)
				)}
			</TableBody>
		</Table>
	);
}
