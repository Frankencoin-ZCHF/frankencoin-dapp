import Head from "next/head";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import AppTitle from "@components/AppTitle";
import AppHeroSteps from "@components/AppHeroSteps";
import LeverageTable from "@components/PageLeverage/LeverageTable";

export default function Leverage() {
	useEffect(() => {
		store.dispatch(fetchPositionsList());
	}, []);

	return (
		<>
			<Head>
				<title>Frankencoin - Leverage</title>
			</Head>

			<AppTitle title="Leverage">
				<div className="text-text-secondary">
					Open a leveraged position in one transaction. The collateral is flash-borrowed, deposited to mint Frankencoins, which are
					swapped back into collateral to repay the flashloan.
				</div>
			</AppTitle>

			<AppHeroSteps
				steps={[
					{
						icon: 1,
						title: "Choose a collateral",
						description: "Pick a collateral with enough flashloan liquidity.",
					},
					{
						icon: 2,
						title: "Define terms",
						description: "Deposit ZCHF or the collateral itself and set maturity and slippage.",
					},
					{
						icon: 3,
						title: "Open the position",
						description: "Flashloan, mint and swap run atomically in a single transaction.",
					},
				]}
			/>

			<div className="mt-8">
				<LeverageTable />
			</div>
		</>
	);
}
