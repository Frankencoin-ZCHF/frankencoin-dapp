import Head from "next/head";
import Link from "next/link";
import MypositionsCollateral from "@components/PageMypositions/MypositionsCollateral";
import MypositionsTable from "@components/PageMypositions/MypositionsTable";

export default function Positions() {
	return (
		<>
			<Head>
				<title>Frankencoin - Positions</title>
			</Head>

			<div className="mt-8">
				<MypositionsCollateral />
				<MypositionsTable />
			</div>

			<div className="flex">
				<Link href={"positions/create"} className="btn btn-primary m-auto">
					Propose New Position Type
				</Link>
			</div>
		</>
	);
}
