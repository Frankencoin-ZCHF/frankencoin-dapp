import Head from "next/head";
import AppTitle from "@components/AppTitle";
import TransferInteractionCard from "@components/PageTransfer/TransferInteractionCard";
import AppLink from "@components/AppLink";
import TransferListTable from "@components/PageTransfer/TransferListTable";

export default function TransferPage() {
	return (
		<>
			<Head>
				<title>Frankencoin - Transfer</title>
			</Head>

			<AppTitle title="Transfer">
				<div className="text-text-secondary">
					Transfer Frankencoins with a reference or across chains using the{" "}
					<AppLink label={"CCIP bridge"} href={"https://app.transporter.io/"} external={true} className="" />.
				</div>
			</AppTitle>

			<div className="md:mt-8">
				<TransferInteractionCard />
			</div>

			<AppTitle title="Transfer Log">
				<div className="text-text-secondary">Find past transfers, limited to 50 results.</div>
			</AppTitle>

			<TransferListTable />
		</>
	);
}
