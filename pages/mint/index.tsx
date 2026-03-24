import Head from "next/head";
import Link from "next/link";
import BorrowTable from "@components/PageBorrow/BorrowTable";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import AppTitle from "@components/AppTitle";
import { fetchMorphoMarkets } from "../../redux/slices/morpho.slice";
import AppHeroSteps from "@components/AppHeroSteps";
import ButtonSecondary from "@components/ButtonSecondary";

export default function Borrow() {
	useEffect(() => {
		store.dispatch(fetchPositionsList());
		store.dispatch(fetchMorphoMarkets());
	}, []);

	return (
		<>
			<Head>
				<title>Frankencoin - Borrow</title>
			</Head>

			<AppTitle title="Borrow Frankencoins">
				<div className="text-text-secondary">
					Deposit a collateral and mint new Frankencoins against it. The collateral stays locked until you return the minted coins.
				</div>
			</AppTitle>

			<AppHeroSteps
				steps={[
					{
						icon: 1,
						title: "Choose a collateral",
						description: "Choose a crypto asset to use as collateral.",
					},
					{
						icon: 2,
						title: "Define terms",
						description: "Adjust amount, maturity, and liquidation price to your liking.",
					},
					{
						icon: 3,
						title: "Receive Frankencoins",
						description: "Fresh Frankencoins are minted directly into your wallet.",
					},
				]}
			/>

			<div className="mt-8">
				<BorrowTable />
			</div>

			<div className="flex items-center justify-center">
				<Link href={"mint/create"}>
					<ButtonSecondary>Propose New Position or Collateral</ButtonSecondary>
				</Link>
			</div>
		</>
	);
}
