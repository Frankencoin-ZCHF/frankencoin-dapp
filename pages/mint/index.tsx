import Head from "next/head";
import Link from "next/link";
import BorrowTable from "@components/PageBorrow/BorrowTable";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import AppTitle from "@components/AppTitle";

export default function Borrow() {
	useEffect(() => {
		store.dispatch(fetchPositionsList());
	}, []);

	return (
		<>
			<Head>
				<title>Frankencoin - Borrow</title>
			</Head>

			<AppTitle title="New Minting Module">
				<div className="text-text-secondary">
					⚠️ New modules with more user-friendly borrowing are planned to be released in early December. We recommend to wait for
					these updates before opening new positions. By that time, WBTC should also be available again as collateral.
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
