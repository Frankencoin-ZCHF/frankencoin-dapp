import Head from "next/head";
import Link from "next/link";
import BorrowTable from "@components/PageBorrow/BorrowTable";
import { useEffect } from "react";
import { RootState, store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import { useSelector } from "react-redux";
import BorrowForm from "@components/PageBorrow/BorrowForm";

export default function Borrow() {
	const expertMode = useSelector((state: RootState) => state.globalPreferences.expertMode);

	useEffect(() => {
		store.dispatch(fetchPositionsList());
	}, []);

	return (
		<>
			<Head>
				<title>dEURO - Borrow</title>
			</Head>

			{expertMode ? (
				<>
					<div className="mt-8">
						<BorrowTable />
					</div>

					<div className="flex">
						<Link href={"mint/create"} className="btn bg-layout-secondary font-bold text-layout-primary m-auto">
							Propose New Position or Collateral
						</Link>
					</div>
				</>
			) : (
				<BorrowForm />
			)}
		</>
	);
}
