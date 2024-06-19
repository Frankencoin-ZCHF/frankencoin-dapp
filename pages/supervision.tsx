import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import Link from "next/link";
import SupervisionCollateral from "@components/PageSupervision/SupervisionCollateral";
import SupervisionTable from "@components/PageSupervision/SupervisionTable";

export default function Positions() {
	return (
		<>
			<Head>
				<title>Frankencoin - Supervision</title>
			</Head>

			<div className="mt-8">
				<SupervisionCollateral />
				<SupervisionTable />
			</div>

			<div className="flex">
				<Link href={"positions/create"} className="btn btn-primary m-auto">
					Propose New Position Type
				</Link>
			</div>
		</>
	);
}
