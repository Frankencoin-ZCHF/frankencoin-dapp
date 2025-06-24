import Head from "next/head";
import { useRouter } from "next/router";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import { formatDateTime, shortenAddress } from "@utils";
import { Address, formatUnits, zeroAddress } from "viem";
import { useContractUrl } from "@hooks";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { CONFIG, WAGMI_CONFIG } from "../../../app.config";
import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { ChallengesQueryItem, PositionQuery } from "@frankencoin/api";
import { useRouter as useNavigation } from "next/navigation";
import Button from "@components/Button";
import { ADDRESS, FrankencoinABI } from "@frankencoin/zchf";
import DisplayOutputAlignedRight from "@components/DisplayOutputAlignedRight";
import AppLink from "@components/AppLink";
import { mainnet } from "viem/chains";

export default function PositionDetail() {
	const [reserve, setReserve] = useState<bigint>(0n);

	const router = useRouter();
	const address = router.query.address as Address;
	const chainId = mainnet.id;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const challengesPositions = useSelector((state: RootState) => state.challenges.positions);

	const position = positions.find((p) => p.position.toLowerCase() === address.toLowerCase());
	const challengesActive = (challengesPositions.map[address.toLowerCase() as Address] || []).filter((c) => c.status === "Active");

	const positionExplorerUrl = useContractUrl(String(address));
	const ownerExplorerLink = useContractUrl(position?.owner || zeroAddress);
	const myPosLink = `/mypositions?address=${position?.owner || zeroAddress}`;
	const parentLink = `/monitoring/${(position?.version == 2 && position?.parent) || zeroAddress}`;

	useEffect(() => {
		if (!position) return;

		const fetchAsync = async function () {
			const data = await readContract(WAGMI_CONFIG, {
				address: position.zchf,
				chainId,
				abi: FrankencoinABI,
				functionName: "calculateAssignedReserve",
				args: [BigInt(position.minted), position.reserveContribution],
			});

			setReserve(data);
		};

		fetchAsync();
	}, [position, chainId]);

	if (!position) return;

	const isSubjectToCooldown = () => {
		const now = BigInt(Math.floor(Date.now() / 1000));
		return now < position.cooldown && position.cooldown < 32508005122n;
	};

	const parentAddressInfo = (): string => {
		if (position.version == 1) return "Not available for V1";
		else if (position.version == 2) {
			if (position.isOriginal) return "-";
			else return shortenAddress(position.parent);
		} else return "-";
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Position Details</title>
			</Head>
			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center">Position Details</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:col-span-2">
							<AppBox>
								<DisplayLabel label="Minted Total" />
								<DisplayAmount amount={BigInt(position.minted)} currency="ZCHF" address={ADDRESS[chainId].frankencoin} />
							</AppBox>
							<AppBox>
								<DisplayLabel label="Collateral" />
								<DisplayAmount
									amount={BigInt(position.collateralBalance)}
									currency={position.collateralSymbol}
									digits={position.collateralDecimals}
									address={position.collateral}
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Liquidation Price" />
								<DisplayAmount
									amount={BigInt(position.price)}
									currency={"ZCHF"}
									digits={36 - position.collateralDecimals}
									address={ADDRESS[chainId].frankencoin}
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Retained Reserve" />
								<DisplayAmount amount={reserve} currency={"ZCHF"} address={ADDRESS[chainId].frankencoin} />
							</AppBox>
							<AppBox>
								<DisplayLabel label="Limit" />
								<DisplayAmount
									amount={BigInt(position.limitForClones)}
									currency={"ZCHF"}
									address={ADDRESS[chainId].frankencoin}
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Available for Clones" />
								<DisplayAmount
									amount={BigInt(position.availableForClones)}
									currency={"ZCHF"}
									address={ADDRESS[chainId].frankencoin}
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Auction Duration" />
								<DisplayOutputAlignedRight amount={position.challengePeriod / 60 / 60} unit={"hours"} />
							</AppBox>
							<AppBox>
								<DisplayLabel label="Owner" />
								<AppLink label={shortenAddress(position.owner)} href={myPosLink} external={false} />
							</AppBox>
							<AppBox>
								<DisplayLabel label="Reserve Requirement" />
								<DisplayOutputAlignedRight amount={BigInt(position.reserveContribution / 100)} digits={2} unit={"%"} />
							</AppBox>
							<AppBox>
								<DisplayLabel label="Annual Interest" />
								<DisplayOutputAlignedRight amount={BigInt(position.annualInterestPPM / 100)} digits={2} unit={"%"} />
							</AppBox>
							<AppBox>
								<DisplayLabel label="Start Date" />
								<DisplayOutputAlignedRight
									output={formatDateTime(position.isOriginal ? position.start : position.created)}
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Expiration Date" />
								<DisplayOutputAlignedRight output={position.closed ? "Closed" : formatDateTime(position.expiration)} />
							</AppBox>
							<AppBox>
								<DisplayLabel label="Smart Contract" />
								<AppLink label={shortenAddress(position.position)} href={positionExplorerUrl} external={true} />
							</AppBox>
							<AppBox>
								<DisplayLabel label="Parent Position" />
								<AppLink label={parentAddressInfo()} href={parentLink} external={false} />
							</AppBox>
						</div>
					</div>
					<div>
						{isSubjectToCooldown() && (
							<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col mb-4">
								<div className="text-lg font-bold text-center">Cooldown</div>
								<AppBox className="flex-1 mt-4">
									<p>
										This position is subject to a cooldown period that ends on {formatDateTime(position.cooldown)} as
										its owner has recently increased the applicable liquidation price. The cooldown period gives other
										users an opportunity to challenge the position before additional Frankencoins can be minted.
									</p>
								</AppBox>
							</div>
						)}

						<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col mb-4">
							<div className="text-lg font-bold text-center">Active Challenges ({challengesActive.length})</div>

							{challengesActive.map((c, idx) => (
								<ActiveAuctionsRow key={c.id || `ActiveAuctionsRow_${idx}`} position={position} challenge={c} />
							))}
							{challengesActive.length === 0 ? <ActiveAuctionsRowEmpty /> : null}
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

interface Props {
	position: PositionQuery;
	challenge: ChallengesQueryItem;
}

function ActiveAuctionsRow({ position, challenge }: Props) {
	const navigate = useNavigation();

	const beginning: number = parseFloat(formatUnits(challenge.size, position.collateralDecimals));
	const remaining: number = parseFloat(formatUnits(challenge.size - challenge.filledSize, position.collateralDecimals));
	return (
		<AppBox className="flex-1 mt-4">
			<AppBox className="col-span-3">
				<DisplayLabel label="Remaining Size" />
				<DisplayAmount
					amount={BigInt(challenge.size - challenge.filledSize)}
					digits={position.collateralDecimals}
					currency={position.collateralSymbol}
					address={position.collateral}
				/>

				<Button
					className="h-10 mt-6"
					onClick={() => navigate.push(`/monitoring/${challenge.position.toLowerCase()}/auction/${challenge.number}`)}
				>
					Bid
				</Button>
			</AppBox>
		</AppBox>
	);
}

function ActiveAuctionsRowEmpty() {
	return (
		<AppBox className="flex-1 mt-4">
			<p>This position is currently not being challenged.</p>
		</AppBox>
	);
}
