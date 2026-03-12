import SavingsGlobalCard from "@components/PageSavings/SavingsGlobalCard";
import SavingsInteractionCard from "@components/PageSavings/SavingsInteractionCard";
import Head from "next/head";
import { useEffect, useState } from "react";
import { RootState, store } from "../redux/redux.store";
import { fetchLeadrate, fetchSavings } from "../redux/slices/savings.slice";
import { useAccount, useChainId } from "wagmi";
import AppTitle from "@components/AppTitle";
import SavingsRankedBalancesTable from "@components/PageSavings/SavingsRankedBalancesTable";
import AppLink from "@components/AppLink";
import AppHeroSteps from "@components/AppHeroSteps";
import SavingsRecentActivitiesTable from "@components/PageSavings/SavingsRecentActivitiesTable";
import { useRouter } from "next/router";
import { Address, isAddress, zeroAddress } from "viem";
import ReportsYearlyTable from "@components/PageReports/ReportsSavingsYearlyTable";
import { useSelector } from "react-redux";
import { formatCurrency, getChainByName, normalizeAddress } from "@utils";
import { useAppKitNetwork } from "@reown/appkit/react";
import { ADDRESS, ChainId } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

export default function SavingsPage() {
	const { status } = useSelector((state: RootState) => state.savings.savingsInfo);
	const activities = useSelector((state: RootState) => state.savings.savingsActivity);
	const { address } = useAccount();
	const router = useRouter();
	const AppKitNetwork = useAppKitNetwork();
	const chainId = useChainId() as ChainId;

	const queryAddress: Address = String(router.query.address).toLowerCase() as Address;
	const account = isAddress(queryAddress) ? queryAddress : address ?? zeroAddress;

	const queryChain: string = String(router.query.chain).toLowerCase();
	const [targetChainName, setTargetChainName] = useState("");

	const savingsAddress = normalizeAddress(ADDRESS[mainnet.id].savingsReferral);
	const saveRate = status[mainnet.id][savingsAddress].rate / 10000;

	useEffect(() => {
		store.dispatch(fetchLeadrate());
		store.dispatch(fetchSavings(account == zeroAddress ? undefined : account));
	}, [account]);

	useEffect(() => {
		if (targetChainName.length > 0) return;

		let targetChainToCheck = queryChain.toLowerCase();

		if (targetChainToCheck == "optimism") {
			targetChainToCheck = "OP Mainnet";
		} else if (targetChainToCheck == "arbitrum") {
			targetChainToCheck = "Arbitrum One";
		}

		const targetChain = getChainByName(targetChainToCheck);

		if (targetChain.id != chainId) {
			AppKitNetwork.switchNetwork(targetChain);
		}

		setTargetChainName(targetChain.name);
	}, [chainId, queryChain, AppKitNetwork, targetChainName]);

	return (
		<>
			<Head>
				<title>Frankencoin - Earn</title>
			</Head>

			<AppTitle title={`Earn`}>
				<div className={`text-text-secondary`}>
					Earn interest on your Frankencoins — now available across multiple chains. View and manage your account here.
				</div>
				<div className={`text-text-secondary`}>
					Get a glance over the latest changes via the{" "}
					<AppLink className="" label="transaction logs." href={"/monitoring/logs?kind=Savings"} external={false} />
				</div>
			</AppTitle>

			<AppHeroSteps
				steps={[
					{
						icon: 1,
						title: "Deposit ZCHF",
						description: "Send your Frankencoins into the savings module on any supported chain.",
					},
					{
						icon: 2,
						title: `Earn ${formatCurrency(saveRate)}% interest`,
						description: "Your balance accrues interest automatically based on the current lead rate.",
					},
					{
						icon: 3,
						title: "Withdraw anytime",
						description: "Redeem your ZCHF plus earned interest whenever you want — no lock-up period.",
					},
				]}
			/>

			<SavingsInteractionCard />

			<div className="text-text-secondary">
				Alternatively, you can also earn a yield by lending on
				<AppLink
					label={" Morpho"}
					href={"https://app.morpho.org/ethereum/earn?assetIdsFilter=ecc8bd13-eab5-4c7b-97e1-ba23d58f8cd3"}
					external={true}
					className=""
				/>
				.
			</div>

			<AppTitle title="Yearly Accounts">
				<div className={`text-text-secondary`}>
					The yearly interest income of the current account. See also the
					<AppLink className="" label={" report page"} href={`/report`} />.
				</div>
			</AppTitle>
			<ReportsYearlyTable activity={account == undefined || account == zeroAddress ? [] : activities} />

			<AppTitle title={"Your latest Activities"} />

			<SavingsRecentActivitiesTable />

			<AppTitle title="Top Saver's Accounts" />

			<SavingsRankedBalancesTable />
		</>
	);
}
function setError(arg0: string) {
	throw new Error("Function not implemented.");
}
