import Head from "next/head";
import MonitoringTable from "@components/PageMonitoring/MonitoringTable";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";

export default function Positions() {
	useEffect(() => {
		store.dispatch(fetchPositionsList());
	}, []);

	return (
		<>
			<Head>
				<title>dEURO - Monitoring</title>
			</Head>

			<div className="md:mt-8">
				<h1 className="sm:hidden text-3xl font-black leading-9 tracking-tight mb-2 mt-4">Monitoring</h1>
				<MonitoringTable />
			</div>
		</>
	);
}
