import Head from "next/head";
import MypositionsTable from "@components/PageMypositions/MypositionsTable";
import MyPositionsChallengesTable from "@components/PageMypositions/MyPositionsChallengesTable";
import MyPositionsBidsTable from "@components/PageMypositions/MyPositionsBidsTable";
import { useRouter } from "next/router";
import { Address } from "viem";
import { shortenAddress } from "@utils";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import { fetchChallengesList } from "../../redux/slices/challenges.slice";
import { fetchBidsList } from "../../redux/slices/bids.slice";

export default function Positions() {
	const router = useRouter();
	const overwrite: Address = router.query.address as Address;

	useEffect(() => {
		store.dispatch(fetchPositionsList());
		store.dispatch(fetchChallengesList());
		store.dispatch(fetchBidsList());
	}, []);

	return (
		<>
			<Head>
				<title>dEURO - Positions</title>
			</Head>

			{/* Section Positions */}
			<div className="md:mt-8">
				<div>
					<div className="text-3xl font-black leading-9 tracking-tight mb-2 mt-4">Owned Positions</div>
					<DisplayWarningMessage overwrite={overwrite} />
				</div>

				<div className="">
					<MypositionsTable />
				</div>

				<div className="mt-10">
					<div className="text-3xl font-black leading-9 tracking-tight mb-2 mt-4">Initiated Challenges</div>
					<DisplayWarningMessage overwrite={overwrite} />
				</div>

				<div className="">
					<MyPositionsChallengesTable />
				</div>

				{/* Section Bids */}
				<div className="mt-10">
					<div className="text-3xl font-black leading-9 tracking-tight mb-2 mt-4">Initiated Bids</div>
					<DisplayWarningMessage overwrite={overwrite} />
				</div>

				<div className="">
					<MyPositionsBidsTable />
				</div>
			</div>
		</>
	);
}

function DisplayWarningMessage(props: { overwrite: Address }) {
	return (
		<div>
			<span className="font-bold text-sm">{props.overwrite ? `(Public View for: ${shortenAddress(props.overwrite)})` : ""}</span>
		</div>
	);
}
