import SavingsGlobalCard from "@components/PageSavings/SavingsGlobalCard";
import SavingsInteractionCard from "@components/PageSavings/SavingsInteractionCard";
import SavingsInterestTable from "@components/PageSavings/SavingsInterestTable";
import SavingsSavedTable from "@components/PageSavings/SavingsSavedTable";
import SavingsWithdrawnTable from "@components/PageSavings/SavingsWithdrawnTable";
import Head from "next/head";
import { useEffect } from "react";
import { store } from "../redux/redux.store";
import { fetchBalance, fetchSavings } from "../redux/slices/savings.slice";
import { useAccount } from "wagmi";
import AppTitle from "@components/AppTitle";
import SavingsRankedBalancesTable from "@components/PageSavings/SavingsRankedBalancesTable";
import { useContractUrl } from "@hooks";
import { ADDRESS } from "@frankencoin/zchf";
import { WAGMI_CHAIN } from "../app.config";
import { shortenAddress } from "@utils";
import AppLink from "@components/AppLink";

export default function SavingsPage() {
	const { address } = useAccount();

	useEffect(() => {
		store.dispatch(fetchSavings(address));
		store.dispatch(fetchBalance());
	}, [address]);

	const savings = ADDRESS[WAGMI_CHAIN.id].savings;
	const link = useContractUrl(savings);

	return (
		<>
			<Head>
				<title>Frankencoin - Savings</title>
			</Head>

			<AppTitle title={`Savings `}>
				<div className="text-text-secondary">
					View the Savings Module in the explorer{" "}
					<AppLink label={shortenAddress(savings) + "."} href={link} external={true} className="pr-1" />
				</div>
			</AppTitle>

			<SavingsGlobalCard />

			<SavingsInteractionCard />

			<AppTitle title="Recent Deposits" />

			<SavingsSavedTable />

			<AppTitle title="Recent Interest Claims" />

			<SavingsInterestTable />

			<AppTitle title="Recent Withdrawals" />

			<SavingsWithdrawnTable />

			<AppTitle title="Top Saver's Accounts" />

			<SavingsRankedBalancesTable />
		</>
	);
}
