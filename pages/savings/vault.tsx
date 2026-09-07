import { useEffect, useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { isAddress } from "viem";
import { useConnection } from "wagmi";
import { useSelector } from "react-redux";
import { mainnet } from "viem/chains";
import { ADDRESS } from "@frankencoin/zchf";
import { formatCurrency, normalizeAddress } from "@utils";
import AppTitle from "@components/AppTitle";
import AppHeroSteps from "@components/AppHeroSteps";
import AppLink from "@components/AppLink";
import VaultInteractionCard from "@components/PageVault/VaultInteractionCard";
import VaultChainBalancesTable from "@components/PageVault/VaultChainBalancesTable";
import { RootState, store } from "../../redux/redux.store";
import { fetchLeadrate } from "../../redux/slices/savings.slice";

export default function VaultPage() {
	const router = useRouter();
	const { address } = useConnection();
	const { status } = useSelector((state: RootState) => state.savings.savingsInfo);

	const queryAddress = router.query.address as string | undefined;
	const viewAddress = useMemo(() => {
		if (queryAddress && isAddress(queryAddress)) return queryAddress;
		return address;
	}, [queryAddress, address]);
	const isViewingOtherAddress =
		!!queryAddress && isAddress(queryAddress) && (!address || normalizeAddress(queryAddress) !== normalizeAddress(address));

	const savingsAddress = normalizeAddress(ADDRESS[mainnet.id].savingsReferral);
	const saveRate = (status[mainnet.id]?.[savingsAddress]?.rate ?? 0) / 10000;

	useEffect(() => {
		store.dispatch(fetchLeadrate());
	}, []);

	return (
		<>
			<Head>
				<title>Frankencoin - Savings Vault</title>
			</Head>

			<AppTitle title="Savings Vault">
				<div className="text-text-secondary">
					svZCHF is the tokenized version of your Frankencoin savings — wrap ZCHF once and hold a single yield-bearing token on
					Ethereum, Optimism, Gnosis Chain or Base. See also the <AppLink className="" label="Earn page" href={`/savings`} />.
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
					{ icon: 1, title: "Wrap your ZCHF", description: "Deposit ZCHF and receive svZCHF, an ERC-4626 vault token." },
					{
						icon: 2,
						title: `Up to ${formatCurrency(saveRate)}% interest, compounding`,
						description: "Your svZCHF exchange rate rises automatically as interest accrues — no claiming needed.",
					},
					{ icon: 3, title: "Unwrap anytime", description: "Redeem svZCHF for ZCHF plus accrued interest, whenever you like." },
				]}
			/>

			<div className="mt-8">
				<VaultInteractionCard viewAddress={viewAddress} isViewingOtherAddress={isViewingOtherAddress} />
			</div>

			<div className="mt-8">
				<VaultChainBalancesTable viewAddress={viewAddress} />
			</div>
		</>
	);
}
