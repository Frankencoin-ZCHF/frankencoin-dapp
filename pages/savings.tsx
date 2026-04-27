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

	const queryAddress: Address = normalizeAddress(String(router.query.address));
	const account = isAddress(queryAddress) ? queryAddress : address ?? zeroAddress;

	const queryChain: string = String(router.query.chain).toLowerCase();
	const [targetChainName, setTargetChainName] = useState("");

	const totalBalance = useSelector((state: RootState) => state.savings.savingsInfo.totalBalance);
	const savingsAddress = normalizeAddress(ADDRESS[mainnet.id].savingsReferral);
	const saveRate = (status[mainnet.id]?.[savingsAddress]?.rate ?? 0) / 10000;

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
					Earn interest on your Frankencoins - supported on all eight chains. Already more than {" "}
					{Math.floor(totalBalance / 1000000)} million ZCHF saved.
				</div>
			</AppTitle>

			<AppHeroSteps
				steps={[
					{
						icon: 1,
						title: "Deposit Frankencoins",
						description: "Your Frankencoins stay in the savings module.",
					},
					{
						icon: 2,
						title: `${formatCurrency(saveRate)}% interest`,
						description: "Interest accrues as time passes.",
					},
					{
						icon: 3,
						title: "Withdraw anytime",
						description: "Withdraw your Frankencoins plus interest at any time.",
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
		</>
	);
}
function setError(arg0: string) {
	throw new Error("Function not implemented.");
}
