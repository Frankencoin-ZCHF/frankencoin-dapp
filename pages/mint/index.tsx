import Head from "next/head";
import Link from "next/link";
import BorrowTable from "@components/PageBorrow/BorrowTable";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import AppTitle from "@components/AppTitle";
import { fetchMorphoMarkets } from "../../redux/slices/morpho.slice";
import BorrowMorphoTable from "@components/PageBorrow/BorrowMorphoTable";

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

			<AppTitle title="Borrow on Morpho">
				<div className="text-text-secondary">
					Borrow Frankencoins (ZCHF) at variable rates on the lending platform <a href="https://morpho.org/">Morpho</a>.
				</div>
			</AppTitle>

			<div className="mt-8">
				<BorrowMorphoTable />
			</div>

			<AppTitle title="Mint fresh Frankencoins">
				<div className="text-text-secondary">
					Mint Frankencoins (ZCHF) at a fixed rate for your duration of choice.
				</div>
			</AppTitle>

			<div className="mt-8">
				<BorrowTable />
			</div>

			<div className="flex">
				<Link
					href={"mint/create"}
					className="btn bg-layout-primary border-text-primary text-menu-text hover:bg-button-hover m-auto"
				>
					Propose New Position or Collateral
				</Link>
			</div>

		</>
	);
}
