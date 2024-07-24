import Head from "next/head";
import MypositionsCollateral from "@components/PageMypositions/MypositionsCollateral";
import MypositionsTable from "@components/PageMypositions/MypositionsTable";

export default function Positions() {
	return (
		<>
			<Head>
				<title>Frankencoin - Positions</title>
			</Head>

			<div className="md:mt-8">
				<MypositionsTable />
			</div>
		</>
	);
}
