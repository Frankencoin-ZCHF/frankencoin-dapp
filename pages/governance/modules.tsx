import Head from "next/head";
import GovernanceMintersTable from "@components/PageGovernance/GovernanceMintersTable";
import AppTitle from "@components/AppTitle";

export default function GovernanceModules() {
	return (
		<>
			<Head>
				<title>Frankencoin - Minting Modules</title>
			</Head>

			<AppTitle title="List of all Minting Modules"></AppTitle>

			<GovernanceMintersTable />
		</>
	);
}
