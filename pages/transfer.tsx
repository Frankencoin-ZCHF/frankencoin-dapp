import Head from "next/head";
import AppTitle from "@components/AppTitle";
import TransferInteractionCard from "@components/PageTransfer/TransferInteractionCard";

export default function TransferPage() {
	return (
		<>
			<Head>
				<title>Frankencoin - Transfer</title>
			</Head>

			<AppTitle title="Transfer">
				<div className="text-text-secondary">
					Transfer Frankencoins with a reference or across chains using the CCIP bridge (https://app.transporter.io/).
				</div>
			</AppTitle>

			<div className="md:mt-8">
				<TransferInteractionCard />
			</div>

			{/* <AppTitle title="Auto Saver">
				<div className="text-text-secondary">
					Automatically forward all incoming transfers with reference into the savings module.
				</div>
			</AppTitle> */}

			{/* <TransferInteractionCard />

			<AppTitle title="Transfer Log">
				<div className="text-text-secondary">Find past transfers, limited to 50 results.</div>
			</AppTitle> */}

			{/* <TransferListTable /> */}
		</>
	);
}
