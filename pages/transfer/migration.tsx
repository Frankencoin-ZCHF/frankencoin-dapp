import { useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { isAddress } from "viem";
import { useConnection } from "wagmi";
import AppTitle from "@components/AppTitle";
import AppHeroSteps from "@components/AppHeroSteps";
import MigrationTokenSwapCard from "@components/PageMigration/MigrationTokenSwapCard";
import MigrationBridgeCard from "@components/PageMigration/MigrationBridgeCard";

export default function MigrationPage() {
	const router = useRouter();
	const { address } = useConnection();

	const queryAddress = router.query.address as string | undefined;
	const viewAddress = useMemo(() => {
		if (queryAddress && isAddress(queryAddress)) return queryAddress;
		return address;
	}, [queryAddress, address]);
	const isViewingOtherAddress = !!queryAddress && isAddress(queryAddress) && queryAddress.toLowerCase() !== address?.toLowerCase();

	return (
		<>
			<Head>
				<title>Frankencoin - Migrate to Optimism</title>
			</Head>

			<AppTitle title="Migrate to Optimism">
				<div className="text-text-secondary">
					Move your assets from Gnosis Chain to Optimism: swap everything into ZCHF, then bridge it across.
				</div>
			</AppTitle>

			{isViewingOtherAddress && (
				<div className="mt-4 p-3 rounded-lg bg-card-body-primary text-sm text-text-secondary text-center">
					Viewing {queryAddress} — connect this wallet to take action. Remove the <code>address</code> query parameter to view
					your own wallet.
				</div>
			)}

			<AppHeroSteps
				className="mt-6"
				steps={[
					{ icon: "1", title: "Swap", description: "Convert your Gnosis Chain tokens into ZCHF." },
					{ icon: "2", title: "Bridge", description: "Send the ZCHF to your wallet on Optimism." },
					{ icon: "3", title: "Earn", description: "Automatically wrapped into savings." },
				]}
			/>

			<div className="mt-8 flex flex-col gap-8">
				<MigrationTokenSwapCard viewAddress={viewAddress} />
				<MigrationBridgeCard viewAddress={viewAddress} isViewingOtherAddress={isViewingOtherAddress} />
			</div>
		</>
	);
}
