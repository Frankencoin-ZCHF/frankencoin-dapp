import Head from "next/head";
import AppTitle from "@components/AppTitle";
import { useEffect } from "react";
import { store } from "../redux/redux.store";
import { fetchTransactionLogs } from "../redux/slices/dashboard.slice";
import LogsTable from "@components/PageLogs/LogsTable";

export default function LogsPage() {
	useEffect(() => {
		store.dispatch(fetchTransactionLogs());
	}, []);

	return (
		<div>
			<Head>
				<title>Frankencoin - Logs</title>
			</Head>

			<AppTitle title="Transaction Log">
				<div className="text-text-secondary">
					Track protocol activity, ZCHF metrics, and earnings across the Frankencoin ecosystem. Numbers accounted in ZCHF.
				</div>
			</AppTitle>

			<div className="mt-6">
				<LogsTable />
			</div>
		</div>
	);
}
