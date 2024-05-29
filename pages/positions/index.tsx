import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import PositionTable from "@components/PositionTable";
import Link from "next/link";
import PositionCollateral from "@components/PositionTable/PositionCollateral";

export default function Positions() {
	return (
		<>
			<Head>
				<title>Frankencoin - Positions</title>
			</Head>

			<div className="mt-8">
				<PositionCollateral />
				<AppPageHeader title="My Positions" />
				<PositionTable showMyPos />
				<AppPageHeader title="Other Positions" />
				<PositionTable />
			</div>
			<div className="flex">
				<Link href={"positions/create"} className="btn btn-primary m-auto">
					Propose New Position Type
				</Link>
			</div>
		</>
	);
}
