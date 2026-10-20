import SavingsInteractionCard from "@components/PageSavings/SavingsInteractionCard";
import Head from "next/head";
import { useEffect, useState } from "react";
import { RootState, store } from "../../redux/redux.store";
import { fetchLeadrate, fetchSavings } from "../../redux/slices/savings.slice";
import { useConnection, useChainId } from "wagmi";
import AppTitle from "@components/AppTitle";
import SavingsOverviewCard from "@components/PageSavings/SavingsOverviewCard";
import AppLink from "@components/AppLink";
import AppHeroSteps from "@components/AppHeroSteps";
import SavingsRecentActivitiesTable from "@components/PageSavings/SavingsRecentActivitiesTable";
import { useRouter } from "next/router";
import { Address, isAddress, zeroAddress } from "viem";
import ReportsYearlyTable from "@components/PageReports/ReportsSavingsYearlyTable";
import { useSelector } from "react-redux";
import { formatCurrency, getChain, getChainByName, normalizeAddress } from "@utils";
import { useSavingsAccounts } from "@hooks";
import { useAppKitNetwork } from "@reown/appkit/react";
import { ADDRESS, ChainId } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import { AppKitNetwork } from "@reown/appkit/networks";
import { WAGMI_CHAINS } from "../../app.config";

export default function SavingsPage() {
	const { status } = useSelector((state: RootState) => state.savings.savingsInfo);
	const activities = useSelector((state: RootState) => state.savings.savingsActivity);
	const { address } = useConnection();
	const router = useRouter();
	const AppKitNetwork = useAppKitNetwork();
	const chainId = useChainId() as ChainId;

	const queryAddress: Address = normalizeAddress(String(router.query.address));
	const account = isAddress(queryAddress) ? queryAddress : address ?? zeroAddress;
	const canAdjust = address != undefined && normalizeAddress(address) == normalizeAddress(account);
	const isViewingOther = isAddress(queryAddress) && !canAdjust;

	const { accounts, isLoading, updatedAt, refetch } = useSavingsAccounts(account);
	const selectedSavings = accounts.find((a) => a.chain.id == chainId) ?? accounts[0];

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
			AppKitNetwork.switchNetwork(targetChain as AppKitNetwork);
		}

		setTargetChainName(targetChain.name);
	}, [chainId, queryChain, AppKitNetwork, targetChainName]);

	const onChangeChain = (name: string) => {
		const chain = WAGMI_CHAINS.find((c) => c.name == name) as AppKitNetwork;
		if (chain != undefined && chain.id != chainId) AppKitNetwork.switchNetwork(chain);
	};

	const onSuccess = () => {
		refetch();
		store.dispatch(fetchSavings(account == zeroAddress ? undefined : account));
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Earn</title>
			</Head>

			<AppTitle title={`Earn`}>
				<div className={`text-text-secondary`}>
					Earn interest on your Frankencoins - supported on all eight chains. Already more than{" "}
					{Math.floor(totalBalance / 1000000)} million ZCHF saved. Want a single tradable token instead? Check out the{" "}
					<AppLink className="" label="Savings Vault" href={`/savings/vault`} />.
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

			<section className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto">
				<SavingsOverviewCard
					account={account}
					accounts={accounts}
					isLoading={isLoading}
					updatedAt={updatedAt}
					readOnly={isViewingOther}
					selectedChainId={chainId}
					onSelectChain={(id) => onChangeChain(getChain(id).name)}
				/>
				<SavingsInteractionCard
					savings={selectedSavings}
					hasAccount={account != zeroAddress}
					readOnly={isViewingOther}
					isLoading={isLoading}
					onChangeChain={onChangeChain}
					onSuccess={onSuccess}
				/>
			</section>

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
