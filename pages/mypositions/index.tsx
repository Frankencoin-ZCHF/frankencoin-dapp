import Head from "next/head";
import Link from "next/link";
import MypositionsCollateral from "@components/PageMypositions/MypositionsCollateral";
import SupervisionTable from "@components/PageSupervision/SupervisionTable";

export default function Positions() {
	return (
		<>
			<Head>
				<title>Frankencoin - Positions</title>
			</Head>

			<div className="mt-8">
				<MypositionsCollateral />
			</div>

			<div className="mt-8">
				<SupervisionTable showMyPos />
			</div>

			<div className="flex">
				<Link href={"mypositions/create"} className="btn btn-primary m-auto">
					Propose New Position Type
				</Link>
			</div>
		</>
	);
}
