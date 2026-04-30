import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Address, parseUnits, zeroAddress } from "viem";
import { normalizeAddress } from "@utils";
import { useBlockNumber } from "wagmi";
import { readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../../app.config";
import { RootState } from "../../../redux/redux.store";
import { useSelector } from "react-redux";
import { useRouter as useNavigation } from "next/navigation";
import { ADDRESS, MintingHubV2ABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import AppCard from "@components/AppCard";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import ForceSellPriceChart from "@components/PageMonitoring/ForceSellPriceChart";
import ForceSellAction from "@components/PageMonitoring/ForceSellAction";

export default function MonitoringForceSell() {
	const [auctionPrice, setAuctionPrice] = useState<bigint>(0n);
	const [isNavigating, setNavigating] = useState(false);

	const { data } = useBlockNumber({ watch: true });
	const router = useRouter();
	const navigate = useNavigation();

	const chainId = mainnet.id;
	const queryAddress: Address = (String(router.query.address) as Address) || zeroAddress;
	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => normalizeAddress(p.position) === normalizeAddress(queryAddress));
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const challengesPositions = useSelector((state: RootState) => state.challenges.positions);

	useEffect(() => {
		if (position === undefined) return;

		const fetchAsync = async () => {
			const _price = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].mintingHubV2,
				chainId,
				abi: MintingHubV2ABI,
				functionName: "expiredPurchasePrice",
				args: [position.position as Address],
			});
			setAuctionPrice(_price);
		};

		fetchAsync();
	}, [data, position, chainId]);

	useEffect(() => {
		if (isNavigating) navigate.push("/mypositions");
	}, [isNavigating, navigate]);

	if (!position) return null;

	const priceDigits = 36 - position.collateralDecimals;
	const collateralPriceChf = prices[normalizeAddress(position.collateral)]?.price?.chf;
	const marketPrice = collateralPriceChf ? parseUnits(collateralPriceChf.toFixed(6), priceDigits) : undefined;

	const now = Date.now();
	const positionChallenges = challengesPositions.map[normalizeAddress(position.position)] ?? [];
	const isChallenged = positionChallenges.some((ch) => ch.status === "Active");
	const isCooldown = position.start * 1000 < now && position.cooldown > now;
	const isExpired = now > position.expiration * 1000;

	const statusBadge = isExpired
		? { label: "Expired", className: "bg-red-500/20 text-red-400" }
		: isChallenged
		? { label: "Challenged", className: "bg-orange-500/20 text-orange-400" }
		: isCooldown
		? { label: "Cooldown", className: "bg-amber-500/20 text-amber-400" }
		: { label: "Active", className: "bg-green-500/20 text-green-400" };

	return (
		<div className="flex flex-col md:max-w-2xl mx-auto">
			<Head>
				<title>Frankencoin - Force Sell</title>
			</Head>

			<AppTitle
				symbol={position.collateralSymbol}
				title={`${position.collateralName} (${position.collateralSymbol})`}
				subtitle="Buy collateral at declining auction price"
				badges={[statusBadge]}
				actions={
					<div className="flex flex-wrap gap-4 text-sm">
						<AppLink label="Owner" href={`/mypositions?address=${position.owner}`} external={false} />
						<AppLink label="Reference" href={`/monitoring/${position.position}`} external={false} />
					</div>
				}
			/>

			<div className="mt-8">
				<AppCard>
					<div className="text-lg font-bold text-center">Force Sell</div>
					<ForceSellPriceChart position={position} auctionPrice={auctionPrice} marketPrice={marketPrice} />
					<ForceSellAction position={position} auctionPrice={auctionPrice} onBidSuccess={() => setNavigating(true)} />
				</AppCard>
			</div>
		</div>
	);
}
