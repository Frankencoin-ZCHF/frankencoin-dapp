import Head from "next/head";
import Link from "next/link";
import BorrowTable from "@components/PageBorrow/BorrowTable";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";

export default function Borrow() {
	useEffect(() => {
		store.dispatch(fetchPositionsList());
	}, []);

	return (
		<>
			<Head>
				<title>Frankencoin - Borrow</title>
			</Head>

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
