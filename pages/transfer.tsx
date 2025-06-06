import Head from "next/head";
import AppTitle from "@components/AppTitle";
import TransferListTable from "@components/PageTransfer/TransferListTable";
import TransferInteractionCard from "@components/PageTransfer/TransferInteractionCard";

export default function TransferPage() {
	return (
		<>
			<Head>
				<title>Frankencoin - Transfer</title>
			</Head>

			<AppTitle title="Transfer with Reference">
				<div className="text-text-secondary">
					Here you can make a frankencoin transfer and include a reference, perfect for things like invoice payments.
				</div>
			</AppTitle>

			<TransferInteractionCard />

			<AppTitle title="Transfer Search">
				<div className="text-text-secondary">Use the filters to fine tune your results.</div>
			</AppTitle>

			<TransferListTable />
		</>
	);
}
