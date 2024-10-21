import Head from "next/head";
import MonitoringTable from "@components/PageMonitoring/MonitoringTable";

export default function Positions() {
	return (
		<>
			<Head>
				<title>Frankencoin - Monitoring</title>
			</Head>

			{/* <div>
				<AppPageHeader title="Monitoring For All Positions" />
			</div> */}

			<div className="md:mt-8">
				<MonitoringTable />
			</div>
		</>
	);
}
