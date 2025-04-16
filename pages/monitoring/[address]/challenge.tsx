import Head from "next/head";
import { useRouter } from "next/router";
import AppBox from "@components/AppBox";
import Button from "@components/Button";
import DisplayAmount from "@components/DisplayAmount";
import TokenInput from "@components/Input/TokenInput";
import { erc20Abi, zeroAddress } from "viem";
import { useEffect, useState } from "react";
import { ContractUrl, formatBigInt, formatDuration, shortenAddress, TOKEN_SYMBOL } from "@utils";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { Address } from "viem";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast, renderErrorTxStackToast, renderErrorTxToast } from "@components/TxToast";
import DisplayLabel from "@components/DisplayLabel";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import Link from "next/link";
import { useRouter as useNavigation } from "next/navigation";
import { ADDRESS, MintingHubV2ABI } from "@deuro/eurocoin";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";


export default function PositionChallenge() {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isApproving, setApproving] = useState(false);
	const [isChallenging, setChallenging] = useState(false);
	const [isNavigating, setNavigating] = useState(false);

	const [userAllowance, setUserAllowance] = useState(0n);
	const [userBalance, setUserBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const account = useAccount();
	const router = useRouter();
	const navigate = useNavigation();

	const chainId = useChainId();
	const addressQuery: Address = router.query.address as Address;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == addressQuery);
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const { t } = useTranslation();

	// ---------------------------------------------------------------------------
	useEffect(() => {
		const acc: Address | undefined = account.address;
		const fc: Address = ADDRESS[WAGMI_CHAIN.id].decentralizedEURO;
		if (acc === undefined) return;
		if (!position || !position.collateral) return;

		const fetchAsync = async function () {
			const _balanceColl = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [acc],
			});
			setUserBalance(_balanceColl);

			const _allowanceColl = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				abi: erc20Abi,
				functionName: "allowance",
				args: [acc, ADDRESS[WAGMI_CHAIN.id].mintingHubGateway],
			});
			setUserAllowance(_allowanceColl);
		};

		fetchAsync();
	}, [data, account.address, position]);

	useEffect(() => {
		if (isNavigating && position?.position) {
			navigate.push(`/monitoring/${position.position}`);
		}
	}, [isNavigating, navigate, position]);

	// ---------------------------------------------------------------------------
	if (!position) return null;

	const _collBal: bigint = BigInt(position.collateralBalance);
	const belowMinBalance: boolean = _collBal < BigInt(position.minimumCollateral);

	// ---------------------------------------------------------------------------
	const onChangeAmount = (value: string) => {
		var valueBigInt = BigInt(value);
		if (valueBigInt > _collBal && !belowMinBalance) {
			valueBigInt = _collBal;
		}
		setAmount(valueBigInt);
		if (valueBigInt > userBalance) {
			setError(t("common.error.insufficient_balance", { symbol: position.collateralSymbol }));
		} else if (valueBigInt > BigInt(position.collateralBalance) && !belowMinBalance) {
			setError(t("monitoring.error.amount_cannot_be_larger_than_position"));
		} else if (valueBigInt < BigInt(position.minimumCollateral) && !belowMinBalance) {
			setError(t("monitoring.error.amount_must_be_at_least_the_minimum"));
		} else {
			setError("");
		}
	};

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.collateral as Address,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].mintingHubGateway, amount],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatBigInt(amount, position.collateralDecimals) + " " + position.collateralSymbol,
				},
				{
					title: t("common.txs.spender"),
					value: shortenAddress(ADDRESS[chainId].mintingHubGateway),
				},
				{
					title: t("common.txs.transaction"),
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("common.txs.approving", { symbol: position.collateralSymbol })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("common.txs.title")} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			setApproving(false);
		}
	};

	const handleChallenge = async () => {
		try {
			setChallenging(true);

			const challengeWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].mintingHubGateway,
				abi: MintingHubV2ABI,
				functionName: "challenge",
				args: [position.position, amount, BigInt(position.price)],
			});

			const toastContent = [
				{
					title: t("monitoring.txs.size"),
					value: formatBigInt(amount, position.collateralDecimals) + " " + position.collateralSymbol,
				},
				{
					title: t("common.txs.price"),
					value: formatBigInt(BigInt(position.price), 36 - position.collateralDecimals) + ` ${TOKEN_SYMBOL}`,
				},
				{
					title: t("common.txs.transaction"),
					hash: challengeWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: challengeWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("monitoring.txs.launching_challenge")} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("monitoring.txs.successfully_launched_challenge")} rows={toastContent} />,
				},
			});

			setNavigating(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			setChallenging(false);
		}
	};

	return (
		<>
			<Head>
				<title>dEURO - {t("monitoring.challenge_title")}</title>
			</Head>

			{/* <div>
				<AppPageHeader title="Lunch A Challenge" />
			</div> */}

			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center mt-3">{t("monitoring.challenge_title")}</div>
						<TokenInput
							symbol={position.collateralSymbol}
							max={userBalance}
							balanceLabel={t("common.your_balance")}
							digit={position.collateralDecimals}
							value={amount.toString()}
							onChange={onChangeAmount}
							error={error}
							label={t("common.amount")}
							placeholder={t("common.collateral_amount")}
						/>
						<div className="grid grid-cols-6 gap-2 lg:col-span-2">
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label={t("monitoring.liquidation_price")} />
								<DisplayAmount
									amount={BigInt(position.virtualPrice)}
									currency={TOKEN_SYMBOL}
									digits={36 - position.collateralDecimals}
									address={ADDRESS[chainId].decentralizedEURO}
									className="mt-2"
								/>
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label={t("monitoring.potential_reward")} />
								<DisplayAmount
									amount={(BigInt(position.price) * amount * 2n) / 100n}
									currency={TOKEN_SYMBOL}
									digits={36}
									address={ADDRESS[chainId].decentralizedEURO}
									className="mt-2"
								/>
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label={t("monitoring.collateral_in_position")} />
								<DisplayAmount
									amount={BigInt(position.collateralBalance)}
									currency={position.collateralSymbol}
									digits={position.collateralDecimals}
									address={position.collateral}
									className="mt-2"
								/>
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label={t("monitoring.minimum_amount")} />
								<DisplayAmount
									amount={BigInt(position.minimumCollateral)}
									currency={position.collateralSymbol}
									digits={position.collateralDecimals}
									address={position.collateral}
									className="mt-2"
								/>
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label={t("monitoring.phase_duration")} />
								{formatDuration(position.challengePeriod)}
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label={t("monitoring.target_position")} />
								<Link className="text-link" href={`/monitoring/${position.position}`}>
									{shortenAddress(position.position || zeroAddress)}
								</Link>
							</AppBox>
						</div>
						<div className="mx-auto mt-4 w-72 max-w-full flex-col">
							<GuardToAllowedChainBtn label={amount > userAllowance ? t("common.approve") : t("monitoring.challenge")}>
								{amount > userAllowance ? (
									<Button isLoading={isApproving} disabled={!!error} onClick={() => handleApprove()}>
										{t("common.approve")}
									</Button>
								) : (
									<Button isLoading={isChallenging} disabled={!!error || amount == 0n} onClick={() => handleChallenge()}>
										{t("monitoring.challenge")}
									</Button>
								)}
							</GuardToAllowedChainBtn>
						</div>
					</div>
					<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col">
						<div className="text-lg font-bold text-center mt-3">{t('monitoring.how_it_works')}</div>
						<div className="flex-1 mt-4">
							<p>{t("monitoring.challenge_description_how_it_works")}</p>
							<ol className="flex flex-col gap-y-2 pl-6 [&>li]:list-decimal">
								<li>
									{t("monitoring.challenge_description_how_it_works_phase_1", {
										symbol: position.collateralSymbol,
										price: formatBigInt(BigInt(position.price), 36 - position.collateralDecimals),
										token: TOKEN_SYMBOL,
									})}
								</li>
								<li>
									{t("monitoring.challenge_description_how_it_works_phase_2", {
										symbol: position.collateralSymbol,
										price: formatBigInt(BigInt(position.price), 36 - position.collateralDecimals),
										token: TOKEN_SYMBOL,
									})}
								</li>
							</ol>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

export async function getServerSideProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ["common"])),
		},
	};
}