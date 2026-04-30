import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Address, zeroAddress } from "viem";
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

	return (
		<div className="flex flex-col md:max-w-2xl mx-auto">
			<Head>
				<title>Frankencoin - Force Sell</title>
			</Head>

			<AppTitle
				symbol={position.collateralSymbol}
				title={`${position.collateralName} (${position.collateralSymbol})`}
				subtitle="Buy collateral at declining auction price"
				badges={[{ label: "Expired", className: "bg-red-500/20 text-red-400" }]}
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
					<ForceSellPriceChart position={position} auctionPrice={auctionPrice} />
					<ForceSellAction position={position} auctionPrice={auctionPrice} onBidSuccess={() => setNavigating(true)} />
				</AppCard>
			</div>
		</div>
	);
}
