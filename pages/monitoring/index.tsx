import Head from "next/head";
import MonitoringTable from "@components/PageMonitoring/MonitoringTable";

export default function Positions() {
	return (
		<>
			<Head>
				<title>Frankencoin - Monitoring</title>
			</Head>

			<div className="md:mt-8">
				<MonitoringTable />
			</div>
		</>
	);
}
