import Head from "next/head";
import MypositionsTable from "@components/PageMypositions/MypositionsTable";
import MyPositionsChallengesTable from "@components/PageMypositions/MyPositionsChallengesTable";
import MyPositionsBidsTable from "@components/PageMypositions/MyPositionsBidsTable";
import { useRouter } from "next/router";
import { Address, isAddress, zeroAddress } from "viem";
import { shortenAddress } from "@utils";
import { useEffect, useState } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import { fetchChallengesList } from "../../redux/slices/challenges.slice";
import { fetchBidsList } from "../../redux/slices/bids.slice";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { useContractUrl } from "@hooks";
import { useConnection } from "wagmi";
import ReportsPositionsYearlyTable from "@components/PageReports/ReportsPositionsYearlyTable";
import { OwnerPositionDebt, OwnerPositionFees, OwnerPositionValueLocked } from "../report";
import { FRANKENCOIN_API_CLIENT } from "../../app.config";
import { ApiOwnerDebt, ApiOwnerValueLocked } from "@frankencoin/api";
import PersonalizedNotifications from "@components/PageMypositions/PersonalizedNotifications";

export default function Positions() {
	const { address } = useConnection();
	const router = useRouter();
	const paramAddr = router.query.address as Address;
	const overwrite: Address | undefined = isAddress(paramAddr) ? paramAddr : undefined;
	const account = overwrite ?? address ?? zeroAddress;
	const accountUrl = useContractUrl(account);

	const [isLoading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>("");

	const [ownerPositionFees, setOwnerPositionFees] = useState<OwnerPositionFees[]>([]);
	const [ownerPositionDebt, setOwnerPositionDebt] = useState<OwnerPositionDebt[]>([]);
	const [ownerPositionValueLocked, setOwnerPositionValueLocked] = useState<OwnerPositionValueLocked[]>([]);

	useEffect(() => {
		store.dispatch(fetchPositionsList());
		store.dispatch(fetchChallengesList());
		store.dispatch(fetchBidsList());
	}, []);

	useEffect(() => {
		if (address == undefined && overwrite == undefined) {
			setOwnerPositionFees([]);
			setOwnerPositionDebt([]);
			setError("");
			return;
		}

		setLoading(true);
		const fetcher = async () => {
			try {
				const responsePositionsFees = await FRANKENCOIN_API_CLIENT.get(`/positions/owner/${overwrite || address}/fees`);
				setOwnerPositionFees((responsePositionsFees.data as { t: number; f: string }[]).map((i) => ({ t: i.t, f: BigInt(i.f) })));

				const responsePositionsDebt = await FRANKENCOIN_API_CLIENT.get(`/positions/owner/${overwrite || address}/debt`);
				const debt = responsePositionsDebt.data as ApiOwnerDebt;

				const yearly: OwnerPositionDebt[] = Object.keys(debt).map((y) => ({
					y: Number(y),
					d: BigInt(debt[Number(y)]),
				}));

				setOwnerPositionDebt(yearly);

				const responsePositionsValueLocked = await FRANKENCOIN_API_CLIENT.get(`/prices/owner/${overwrite || address}/valueLocked`);
				const value = responsePositionsValueLocked.data as ApiOwnerValueLocked;

				const yearlyValue: OwnerPositionValueLocked[] = Object.keys(value).map((y) => ({
					y: Number(y),
					v: BigInt(value[Number(y)]),
				}));

				setOwnerPositionValueLocked(yearlyValue);

				// clear all errors
				setError("");
			} catch (error) {
				if (typeof error == "string") {
					setError(error);
				} else {
					setError("Something did not work correctly");
				}
			}
		};

		fetcher();
		setLoading(false);
	}, [address, overwrite]);

	return (
		<>
			<Head>
				<title>Frankencoin - My Positions</title>
			</Head>

			{overwrite && (
				<div className="mb-4 flex items-center gap-3 rounded-lg bg-card-content-primary p-4 text-text-secondary">
					<FontAwesomeIcon icon={faCircleInfo} className="h-5 w-5 flex-shrink-0 text-text-secondary" />
					<span>
						Showing the public view for positions owned by{" "}
						<AppLink className="" label={shortenAddress(overwrite)} href={accountUrl} external={true} /> and not the connected
						wallet.
					</span>
				</div>
			)}

			{/* Section Positions */}
			<AppTitle
				title="Owned Positions"
			>
				<div className="text-text-secondary">
					Open positions belonging to{" "}
					<AppLink className="" label={shortenAddress(account)} href={accountUrl} external={true} />.
				</div>
			</AppTitle>

			<MypositionsTable />

			{/* Section Personalized Notifications */}
			<PersonalizedNotifications />

			{/* Section Report */}
			<AppTitle title="Yearly Accounts">
				<div className="text-text-secondary">
					Open positions at the end of each year as well as interest paid. See also the
					<AppLink className="" label={" report page"} href={`/report?address=${overwrite ?? address ?? zeroAddress}`} />.
				</div>
			</AppTitle>

			<ReportsPositionsYearlyTable
				address={overwrite ?? address ?? zeroAddress}
				ownerPositionFees={ownerPositionFees}
				ownerPositionDebt={ownerPositionDebt}
				ownerPositionValueLocked={ownerPositionValueLocked}
			/>

			{/* Section Challenges */}
			<AppTitle title="Initiated Challenges">
				<div className="text-text-secondary">Challenges you have launched against positions.</div>
			</AppTitle>

			<MyPositionsChallengesTable />

			{/* Section Bids */}
			<AppTitle title="Your Bids">
				<div className="text-text-secondary">Bids you have placed on collateral auctions.</div>
			</AppTitle>

			<MyPositionsBidsTable />
		</>
	);
}