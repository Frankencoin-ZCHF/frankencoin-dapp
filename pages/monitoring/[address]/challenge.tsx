import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Address, parseUnits } from "viem";
import { normalizeAddress } from "@utils";
import { useSelector } from "react-redux";
import { useRouter as useNavigation } from "next/navigation";
import { RootState } from "../../../redux/redux.store";
import { mainnet } from "viem/chains";
import AppCard from "@components/AppCard";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import ChallengeAuctionPriceChart from "@components/PageMonitoring/ChallengeAuctionPriceChart";
import ChallengeAction from "@components/PageMonitoring/ChallengeAction";

export default function PositionChallenge() {
	const [isNavigating, setNavigating] = useState(false);

	const router = useRouter();
	const navigate = useNavigation();

	const addressQuery: Address = router.query.address as Address;
	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == addressQuery);
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	useEffect(() => {
		if (isNavigating && position?.position) {
			navigate.push(`/monitoring/${position.position}`);
		}
	}, [isNavigating, navigate, position]);

	if (!position) return null;

	const nowMs = Date.now();
	const timeToExpiration = nowMs >= position.expiration * 1000 ? 0 : position.expiration * 1000 - nowMs;
	const phase1Ms = Math.min(timeToExpiration, position.challengePeriod * 1000);
	const phase2Ms = position.challengePeriod * 1000;

	const priceDigits = 36 - position.collateralDecimals;
	const collateralPriceChf = prices[normalizeAddress(position.collateral)]?.price?.chf;
	const marketPrice = collateralPriceChf ? parseUnits(collateralPriceChf.toFixed(6), priceDigits) : undefined;

	return (
		<div className="flex flex-col md:max-w-2xl mx-auto">
			<Head>
				<title>Frankencoin - Challenge</title>
			</Head>

			<AppTitle
				symbol={position.collateralSymbol}
				title={`${position.collateralName} (${position.collateralSymbol})`}
				subtitle="Deposit collateral and launch a challenge"
				actions={
					<div className="flex flex-wrap gap-4 text-sm">
						<AppLink label="Owner" href={`/mypositions?address=${position.owner}`} external={false} />
						<AppLink label="Reference" href={`/monitoring/${position.position}`} external={false} />
					</div>
				}
			/>

			<div className="mt-8">
				<AppCard>
					<div className="text-lg font-bold text-center">Launch a Challenge</div>
					<ChallengeAuctionPriceChart
						position={position}
						challengeStartMs={nowMs}
						phase1Ms={phase1Ms}
						phase2Ms={phase2Ms}
						marketPrice={marketPrice}
					/>
					<ChallengeAction position={position} onChallengeSuccess={() => setNavigating(true)} />
				</AppCard>
			</div>
		</div>
	);
}
