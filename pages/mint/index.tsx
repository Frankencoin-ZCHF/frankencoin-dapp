import Head from "next/head";
import Link from "next/link";
import BorrowTable from "@components/PageBorrow/BorrowTable";
import BorrowCollateral from "@components/PageBorrow/BorrowCollateral";
import AppPageHeader from "@components/AppPageHeader";

export default function Borrow() {
	return (
		<>
			<Head>
				<title>Frankencoin - Borrow</title>
			</Head>

			<div className="mt-8">
				<BorrowTable />
			</div>

			<div className="flex">
				<Link href={"mint/create"} className="btn btn-primary m-auto">
					Propose New Position or Collateral
				</Link>
			</div>
		</>
	);
}
