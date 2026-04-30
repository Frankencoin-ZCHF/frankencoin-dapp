import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Address, parseUnits, zeroAddress } from "viem";
import { normalizeAddress } from "@utils";
import { useBlockNumber } from "wagmi";
import { readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../../../app.config";
import { RootState } from "../../../../redux/redux.store";
import { useSelector } from "react-redux";
import { useRouter as useNavigation } from "next/navigation";
import { ADDRESS, MintingHubV1ABI, MintingHubV2ABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import AppCard from "@components/AppCard";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import ChallengeAuctionPriceChart from "@components/PageMonitoring/ChallengeAuctionPriceChart";
import AuctionBidAction from "@components/PageMonitoring/AuctionBidAction";

export default function ChallengePlaceBid() {
	const [auctionPrice, setAuctionPrice] = useState<bigint>(0n);
	const [isNavigating, setNavigating] = useState(false);

	const { data } = useBlockNumber({ watch: true });
	const router = useRouter();
	const navigate = useNavigation();

	const chainId = mainnet.id;
	const addressQuery: Address = normalizeAddress(router.query.address as string);
	const indexQuery: string = router.query.index as string;

	const challenges = useSelector((state: RootState) => state.challenges.list.list);
	const positions = useSelector((state: RootState) => state.positions.list.list);
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const challenge = challenges.find((c) => c.position == (addressQuery ?? zeroAddress) && String(c.number) == indexQuery);
	const position = positions.find((p) => normalizeAddress(p.position) === challenge?.position);

	useEffect(() => {
		if (position === undefined || challenge === undefined) return;

		const fetchAsync = async () => {
			const _price = await readContract(WAGMI_CONFIG, {
				address: position.version === 1 ? ADDRESS[chainId].mintingHubV1 : ADDRESS[chainId].mintingHubV2,
				chainId,
				abi: position.version === 1 ? MintingHubV1ABI : MintingHubV2ABI,
				functionName: "price",
				args: [parseInt(challenge.number.toString())],
			});
			setAuctionPrice(_price);
		};

		fetchAsync();
	}, [data, position, challenge, chainId]);

	useEffect(() => {
		if (isNavigating) navigate.push("/mypositions");
	}, [isNavigating, navigate]);

	if (!challenge || !position) {
		return (
			<div className="flex flex-col md:max-w-2xl mx-auto">
				<Head>
					<title>Frankencoin - Auction</title>
				</Head>

				<AppTitle
					title="Auction"
					subtitle="Buy collateral in the challenge auction"
					badges={[{ label: "Auction", className: "bg-blue-500/20 text-blue-400" }]}
				/>

				<div className="mt-8">
					<div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-600 dark:text-blue-400">
						This auction could not be found. It may have already ended or the data is still loading.
					</div>
				</div>
			</div>
		);
	}

	const startMs = parseInt(challenge.start.toString()) * 1000;
	const durationMs = parseInt(challenge.duration.toString()) * 1000;
	const timeToExpiration = startMs >= position.expiration * 1000 ? 0 : position.expiration * 1000 - startMs;
	const phase1Ms = Math.min(timeToExpiration, durationMs);
	const phase2Ms = durationMs;

	const priceDigits = 36 - position.collateralDecimals;
	const collateralPriceChf = prices[normalizeAddress(position.collateral)]?.price?.chf;
	const marketPrice = collateralPriceChf ? parseUnits(collateralPriceChf.toFixed(6), priceDigits) : undefined;

	return (
		<div className="flex flex-col md:max-w-2xl mx-auto">
			<Head>
				<title>Frankencoin - Auction</title>
			</Head>

			<AppTitle
				symbol={position.collateralSymbol}
				title={`${position.collateralName} (${position.collateralSymbol})`}
				subtitle="Buy collateral in the challenge auction"
				actions={
					<div className="flex flex-wrap gap-4 text-sm">
						<AppLink label="Owner" href={`/mypositions?address=${position.owner}`} external={false} />
						<AppLink label="Reference" href={`/monitoring/${position.position}`} external={false} />
					</div>
				}
			/>

			<div className="mt-8">
				<AppCard>
					<div className="text-lg font-bold text-center">Place a Bid</div>
					<ChallengeAuctionPriceChart
						position={position}
						challengeStartMs={startMs}
						phase1Ms={phase1Ms}
						phase2Ms={phase2Ms}
						auctionPrice={auctionPrice}
						marketPrice={marketPrice}
					/>
					<AuctionBidAction
						position={position}
						challenge={challenge}
						auctionPrice={auctionPrice}
						onBidSuccess={() => setNavigating(true)}
					/>
				</AppCard>
			</div>
		</div>
	);
}
