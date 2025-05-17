import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import { formatDate, getCarryOnQueryParams, shortenAddress, TOKEN_SYMBOL, toQueryString } from "@utils";
import { Address, formatUnits, zeroAddress } from "viem";
import { useContractUrl } from "@hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { CONFIG_CHAIN, WAGMI_CONFIG } from "../../../app.config";
import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { ChallengesQueryItem, PositionQuery } from "@deuro/api";
import { useRouter as useNavigation } from "next/navigation";
import Button, { SecondaryLinkButton } from "@components/Button";
import { ADDRESS, DecentralizedEUROABI } from "@deuro/eurocoin";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

export default function PositionDetail() {
	const [reserve, setReserve] = useState<bigint>(0n);

	const router = useRouter();
	const address = router.query.address as Address;
	const chainId = CONFIG_CHAIN().id;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const challengesPositions = useSelector((state: RootState) => state.challenges.positions);

	const position = positions.find((p) => p.position.toLowerCase() === address.toLowerCase());
	const challengesActive = (challengesPositions.map[address.toLowerCase() as Address] || []).filter((c) => c.status === "Active");
	const explorerUrl = useContractUrl(String(address));
	const ownerLink = useContractUrl(position?.owner || zeroAddress);
	const navigate = useNavigation();
	const { t } = useTranslation();

	useEffect(() => {
		if (!position) return;

		const fetchAsync = async function () {
			const data = await readContract(WAGMI_CONFIG, {
				address: position.deuro,
				abi: DecentralizedEUROABI,
				functionName: "calculateAssignedReserve",
				args: [BigInt(position.principal), position.reserveContribution],
			});

			setReserve(data);
		};

		fetchAsync();
	}, [position]);

	if (!position) return;

	const maturity: number = (position.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24;

	const isSubjectToCooldown = () => {
		const now = BigInt(Math.floor(Date.now() / 1000));
		return now < position.cooldown && position.cooldown < 32508005122n;
	};

	return (
		<>
			<Head>
				<title>dEURO - {t("monitoring.position_overview")}</title>
			</Head>
			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col gap-y-4">
						<Link href={explorerUrl} target="_blank">
							<div className="text-lg font-bold underline text-center">
								{t("monitoring.position")} {shortenAddress(position.position)}
								<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
							</div>
						</Link>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:col-span-2">
							<AppBox>
								<DisplayLabel label={t("monitoring.minted_total")} />
								<DisplayAmount
									amount={BigInt(position.principal)}
									currency={TOKEN_SYMBOL}
									address={ADDRESS[chainId].decentralizedEURO}
									className="mt-2"
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label={t("monitoring.collateral")} />
								<DisplayAmount
									amount={BigInt(position.collateralBalance)}
									currency={position.collateralSymbol}
									digits={position.collateralDecimals}
									address={position.collateral}
									className="mt-2"
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label={t("common.liquidation_price")} />
								<DisplayAmount
									amount={BigInt(position.virtualPrice || position.price)}
									currency={TOKEN_SYMBOL}
									digits={36 - position.collateralDecimals}
									address={ADDRESS[chainId].decentralizedEURO}
									className="mt-2"
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label={t("monitoring.retained_reserve")} />
								<DisplayAmount
									amount={reserve}
									currency={TOKEN_SYMBOL}
									address={ADDRESS[chainId].decentralizedEURO}
									className="mt-2"
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label={t("common.limit")} />
								<DisplayAmount
									amount={BigInt(position.limitForClones)}
									currency={TOKEN_SYMBOL}
									address={ADDRESS[chainId].decentralizedEURO}
									className="mt-2"
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label={t("common.owner")} />
								<div className="mt-2">
									<Link href={ownerLink} className="flex items-center underline" target="_blank">
										{shortenAddress(position.owner)}
										<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
									</Link>
								</div>
							</AppBox>
							<AppBox>
								<DisplayLabel label={t("monitoring.reserve_requirement")} />
								<DisplayAmount amount={BigInt(position.reserveContribution / 100)} digits={2} currency={"%"} hideLogo />
							</AppBox>
							<AppBox>
								<DisplayLabel label={t("monitoring.annual_interest")} />
								<DisplayAmount amount={BigInt(position.annualInterestPPM / 100)} digits={2} currency={"%"} hideLogo />
							</AppBox>
							<AppBox>
								<DisplayLabel label={t("monitoring.start_date")} />
								<b>{formatDate(position.isOriginal ? position.start : position.created)}</b>
							</AppBox>
							<AppBox>
								<DisplayLabel label={t("monitoring.expiration_date")} />
								<b>{position.closed ? t("common.closed") : formatDate(position.expiration)}</b>
							</AppBox>
						</div>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
							<SecondaryLinkButton
								className="h-10 order-1 md:order-2"
								href={`/monitoring/${position.position}/${maturity <= 0 ? "forceSell" : "challenge"}`}
							>
								{maturity <= 0 ? t("monitoring.force_sell") : t("monitoring.challenge")}
							</SecondaryLinkButton>
							<SecondaryLinkButton
								className="h-10 order-2 md:order-3"
								href={`/mint/${position.position}/`}
							>
								{t("mint.clone")}
							</SecondaryLinkButton>
							<Button
								className="h-10 col-span-2 md:col-span-1 md:col-start-1 order-3 md:order-1"
								onClick={() => navigate.push(`/mint/${position.position}/manage/collateral${toQueryString(getCarryOnQueryParams(router))}`)}
							>
								{t("dashboard.manage")}
							</Button>
						</div>
					</div>
					<div>
						{isSubjectToCooldown() && (
							<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col mb-4">
								<div className="text-lg font-bold text-center">{t("monitoring.cooldown")}</div>
								<AppBox className="flex-1 mt-4">
									<p>{t("monitoring.cooldown_message", { formatDate: formatDate(position.cooldown) })}</p>
								</AppBox>
							</div>
						)}

						<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col mb-4">
							<div className="text-lg font-bold text-center">
								{t("monitoring.active_challenges")} ({challengesActive.length})
							</div>

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
	const { t } = useTranslation();

	const beginning: number = parseFloat(formatUnits(challenge.size, position.collateralDecimals));
	const remaining: number = parseFloat(formatUnits(challenge.size - challenge.filledSize, position.collateralDecimals));
	return (
		<AppBox className="flex-1 mt-4">
			<div className={`relative flex flex-row gap-2`}>
				<AppBox className="col-span-3">
					<DisplayLabel label={t("monitoring.remaining_size")} />
					<DisplayAmount
						amount={BigInt(challenge.size - challenge.filledSize)}
						digits={position.collateralDecimals}
						currency={position.collateralSymbol}
						address={position.collateral}
						className="mt-2"
					/>
				</AppBox>

				<div className="absolute right-4 bottom-6 w-20">
					<Button className="h-10" onClick={() => navigate.push(`/challenges/${challenge.id}/bid`)}>
						{t("monitoring.bid")}
					</Button>
				</div>
			</div>
		</AppBox>
	);
}

function ActiveAuctionsRowEmpty() {
	const { t } = useTranslation();
	return (
		<AppBox className="flex-1 mt-4">
			<p>{t("monitoring.no_active_challenges")}</p>
		</AppBox>
	);
}

export async function getServerSideProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ["common"])),
		},
	};
}
