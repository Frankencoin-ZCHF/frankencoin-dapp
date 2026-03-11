import Head from "next/head";
import Link from "next/link";
import BorrowTable from "@components/PageBorrow/BorrowTable";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import AppTitle from "@components/AppTitle";
import { fetchMorphoMarkets } from "../../redux/slices/morpho.slice";
import BorrowMorphoTable from "@components/PageBorrow/BorrowMorphoTable";
import AppLink from "@components/AppLink";
import AppHeroSteps from "@components/AppHeroSteps";

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
					Deposit your crypto as collateral and borrow Frankencoins (ZCHF) — a Swiss Franc stablecoin.
				</div>
				<div className="text-text-secondary">
					You keep your crypto; you get liquid cash. Repay any time to get your collateral back.
				</div>
			</AppTitle>

			<AppHeroSteps
				steps={[
					{
						icon: 1,
						title: "Choose a collateral",
						description: "Pick which crypto token you want to use as collateral from the options below.",
					},
					{
						icon: 2,
						title: "Set your terms",
						description: "Decide how much ZCHF to borrow, review the interest rate and fees upfront.",
					},
					{
						icon: 3,
						title: "Receive ZCHF",
						description: "Your ZCHF is sent directly to your wallet. Repay anytime to unlock your collateral.",
					},
				]}
			/>

			<div className="mt-8">
				<BorrowTable />
			</div>

			<div className="flex">
				<Link href={"mint/create"} className="btn bg-layout-primary border-text-primary text-menu-text hover:bg-white m-auto">
					Propose New Position or Collateral
				</Link>
			</div>

			<AppTitle title="Borrow on Morpho">
				<div className="text-text-secondary">
					Borrow Frankencoins (ZCHF) at variable rates on the lending platform{" "}
					<AppLink href="https://morpho.org/" label="Morpho" className="" external={true} />.
				</div>
			</AppTitle>

			<div className="mt-8">
				<BorrowMorphoTable />
			</div>
		</>
	);
}
