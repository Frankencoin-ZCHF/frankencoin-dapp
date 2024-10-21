import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import { formatDate, shortenAddress } from "@utils";
import { Address, formatUnits, zeroAddress } from "viem";
import { useContractUrl } from "@hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { CONFIG, WAGMI_CONFIG } from "../../../app.config";
import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { ChallengesQueryItem, PositionQuery } from "@frankencoin/api";
import { useRouter as useNavigation } from "next/navigation";
import Button from "@components/Button";
import { ADDRESS, FrankencoinABI } from "@frankencoin/zchf";

export default function PositionDetail() {
	const [reserve, setReserve] = useState<bigint>(0n);

	const router = useRouter();
	const address = router.query.address as Address;
	const chainId = CONFIG.chain.id;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const challengesPositions = useSelector((state: RootState) => state.challenges.positions);

	const position = positions.find((p) => p.position.toLowerCase() === address.toLowerCase());
	const challengesActive = (challengesPositions.map[address.toLowerCase() as Address] || []).filter((c) => c.status === "Active");

	const explorerUrl = useContractUrl(String(address));
	const ownerLink = useContractUrl(position?.owner || zeroAddress);

	useEffect(() => {
		if (!position) return;

		const fetchAsync = async function () {
			const data = await readContract(WAGMI_CONFIG, {
				address: position.zchf,
				abi: FrankencoinABI,
				functionName: "calculateAssignedReserve",
				args: [BigInt(position.minted), position.reserveContribution],
			});

			setReserve(data);
		};

		fetchAsync();
	}, [position]);

	if (!position) return;

	const isSubjectToCooldown = () => {
		const now = BigInt(Math.floor(Date.now() / 1000));
		return now < position.cooldown && position.cooldown < 32508005122n;
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Position Overview</title>
			</Head>
			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col gap-y-4">
						<Link href={explorerUrl} target="_blank">
							<div className="text-lg font-bold underline text-center">
								Position {shortenAddress(position.position)}
								<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
							</div>
						</Link>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:col-span-2">
							<AppBox>
								<DisplayLabel label="Minted Total" />
								<DisplayAmount
									amount={BigInt(position.minted)}
									currency="ZCHF"
									address={ADDRESS[chainId].frankenCoin}
									className="mt-2"
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Collateral" />
								<DisplayAmount
									amount={BigInt(position.collateralBalance)}
									currency={position.collateralSymbol}
									digits={position.collateralDecimals}
									address={position.collateral}
									className="mt-2"
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Liquidation Price" />
								<DisplayAmount
									amount={BigInt(position.price)}
									currency={"ZCHF"}
									digits={36 - position.collateralDecimals}
									address={ADDRESS[chainId].frankenCoin}
									className="mt-2"
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Retained Reserve" />
								<DisplayAmount amount={reserve} currency={"ZCHF"} address={ADDRESS[chainId].frankenCoin} className="mt-2" />
							</AppBox>
							<AppBox>
								<DisplayLabel label="Limit" />
								<DisplayAmount
									amount={BigInt(position.limitForClones)}
									currency={"ZCHF"}
									address={ADDRESS[chainId].frankenCoin}
									className="mt-2"
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Owner" />
								<div className="mt-2">
									<Link href={ownerLink} className="flex items-center underline" target="_blank">
										{shortenAddress(position.owner)}
										<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
									</Link>
								</div>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Reserve Requirement" />
								<DisplayAmount amount={BigInt(position.reserveContribution / 100)} digits={2} currency={"%"} hideLogo />
							</AppBox>
							<AppBox>
								<DisplayLabel label="Annual Interest" />
								<DisplayAmount amount={BigInt(position.annualInterestPPM / 100)} digits={2} currency={"%"} hideLogo />
							</AppBox>
							<AppBox>
								<DisplayLabel label="Start Date" />
								<b>{formatDate(position.start)}</b>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Expiration Date" />
								<b>{position.closed ? "Closed" : formatDate(position.expiration)}</b>
							</AppBox>
						</div>
					</div>
					<div>
						{isSubjectToCooldown() && (
							<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col mb-4">
								<div className="text-lg font-bold text-center">Cooldown</div>
								<AppBox className="flex-1 mt-4">
									<p>
										This position is subject to a cooldown period that ends on {formatDate(position.cooldown)} as its
										owner has recently increased the applicable liquidation price. The cooldown period gives other users
										an opportunity to challenge the position before additional Frankencoins can be minted.
									</p>
								</AppBox>
							</div>
						)}

						<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col mb-4">
							<div className="text-lg font-bold text-center">Active Challenges ({challengesActive.length})</div>

							{challengesActive.map((c) => ActiveAuctionsRow({ position, challenge: c }))}
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
			<div className={`relative flex flex-row gap-2`}>
				<AppBox className="col-span-3">
					<DisplayLabel label="Remaining Size" />
					<DisplayAmount
						amount={BigInt(challenge.size - challenge.filledSize)}
						digits={position.collateralDecimals}
						currency={position.collateralSymbol}
						address={position.collateral}
						className="mt-2"
					/>
				</AppBox>

				<div className="absolute right-4 bottom-6 w-20">
					<Button className="h-10" onClick={() => navigate.push(`/challenges/${challenge.number}/bid`)}>
						Bid
					</Button>
				</div>
			</div>
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
