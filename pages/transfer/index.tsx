import Head from "next/head";
import AppTitle from "@components/AppTitle";
import { useEffect } from "react";
import { ADDRESS } from "@frankencoin/zchf";
import { WAGMI_CHAIN } from "../../app.config";
import TransferListTable from "@components/PageTransfer/TransferListTable";
import TransferInteractionCard from "@components/PageTransfer/TransferInteractionCard";

export default function TransferPage() {
	useEffect(() => {
		//
	}, []);

	console.log(ADDRESS[WAGMI_CHAIN.id]);

	return (
		<>
			<Head>
				<title>Frankencoin - Transfer</title>
			</Head>

			<AppTitle title="Transfer with Reference">
				<div className="text-text-secondary">Here you can make a frankencoin transfer and include a reference.</div>
			</AppTitle>

			<TransferInteractionCard />

			<AppTitle title="View your Transfers">
				<div className="text-text-secondary">Uee the filters to fine tune your results</div>
			</AppTitle>

			<TransferListTable />
		</>
	);
}
