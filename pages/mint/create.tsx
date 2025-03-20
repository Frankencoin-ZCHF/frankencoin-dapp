"use client";
import Head from "next/head";
import { useEffect } from "react";
import { Address, isAddress, maxUint256 } from "viem";
import TokenInput from "@components/Input/TokenInput";
import { useTokenData, useUserBalance } from "@hooks";
import { useState } from "react";
import Button from "@components/Button";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { erc20Abi } from "viem";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { formatBigInt, shortenAddress, TOKEN_SYMBOL, SOCIAL } from "@utils";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast, renderErrorTxToast } from "@components/TxToast";
import Link from "next/link";
import NormalInput from "@components/Input/NormalInput";
import AddressInput from "@components/Input/AddressInput";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, MintingHubGatewayABI } from "@deuro/eurocoin";
import { useTranslation, Trans } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function PositionCreate({}) {
	const [minCollAmount, setMinCollAmount] = useState(0n);
	const [initialCollAmount, setInitialCollAmount] = useState(0n);
	const [limitAmount, setLimitAmount] = useState(1_000_000n * BigInt(1e18));
	const [proposalFee, setProposalFee] = useState(1000n);
	const [initPeriod, setInitPeriod] = useState(5n);
	const [liqPrice, setLiqPrice] = useState(0n);
	const [interest, setInterest] = useState(30000n);
	const [maturity, setMaturity] = useState(12n);
	const [buffer, setBuffer] = useState(200000n);
	const [auctionDuration, setAuctionDuration] = useState(48n);
	const [collateralAddress, setCollateralAddress] = useState("");
	const [minCollAmountError, setMinCollAmountError] = useState("");
	const [initialCollAmountError, setInitialCollAmountError] = useState("");
	const [collTokenAddrError, setCollTokenAddrError] = useState("");
	const [limitAmountError, setLimitAmountError] = useState("");
	const [interestError, setInterestError] = useState("");
	const [initError, setInitError] = useState("");
	const [liqPriceError, setLiqPriceError] = useState("");
	const [bufferError, setBufferError] = useState("");
	const [durationError, setDurationError] = useState("");
	const [isConfirming, setIsConfirming] = useState("");

	const [userAllowance, setUserAllowance] = useState<bigint>(0n);
	const { data } = useBlockNumber({ watch: true });
	const account = useAccount();

	const chainId = useChainId();
	const collTokenData = useTokenData(collateralAddress);
	const userBalance = useUserBalance();

	const { allowance: deuroAllowance, refetch: refetchDeuroAllowance } = useTokenData(ADDRESS[WAGMI_CHAIN.id].decentralizedEURO);

	const { t } = useTranslation();

	useEffect(() => {
		const acc: Address | undefined = account.address;
		if (acc === undefined) return;
		if (isConfirming == "approve") return;
		if (isAddress(collateralAddress) == false) return;

		const fetchAsync = async function () {
			const _allowance = await readContract(WAGMI_CONFIG, {
				address: collateralAddress as Address,
				abi: erc20Abi,
				functionName: "allowance",
				args: [acc, ADDRESS[WAGMI_CHAIN.id].mintingHubGateway],
			});
			setUserAllowance(_allowance);
		};

		fetchAsync();
	}, [data, account.address, collateralAddress, isConfirming]);

	useEffect(() => {
		if (isAddress(collateralAddress)) {
			if (collTokenData.name == "NaN") {
				setCollTokenAddrError(t("mint.error.could_not_obtain_token_data"));
			} else if (collTokenData.decimals > 24n) {
				setCollTokenAddrError(t("mint.error.token_decimals_should_be_less_than_24"));
			} else {
				setCollTokenAddrError("");
			}
		} else {
			setLiqPriceError("");
			setLimitAmountError("");
			setMinCollAmountError("");
			setInitialCollAmountError("");
			setCollTokenAddrError("");
		}
	}, [collateralAddress, collTokenData]);

	const onChangeProposalFee = (value: string) => {
		const valueBigInt = BigInt(value);
		setProposalFee(valueBigInt);
	};

	const onChangeMinCollAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setMinCollAmount(valueBigInt);
		if (valueBigInt > initialCollAmount) {
			setInitialCollAmount(valueBigInt);
			onChangeInitialCollAmount(valueBigInt.toString());
		}
		checkCollateralAmount(valueBigInt, liqPrice);
	};

	const onChangeInitialCollAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setInitialCollAmount(valueBigInt);
		if (valueBigInt < minCollAmount) {
			setInitialCollAmountError(t("mint.error.must_be_at_least_the_minimum_amount"));
		} else if (valueBigInt > collTokenData.balance) {
			setInitialCollAmountError(t("common.error.insufficient_balance", { symbol: collTokenData.symbol }));
		} else {
			setInitialCollAmountError("");
		}
	};

	const onChangeLimitAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setLimitAmount(valueBigInt);
	};

	const onChangeCollateralAddress = (addr: string) => {
		setCollateralAddress(addr);
		setMinCollAmount(0n);
		setInitialCollAmount(0n);
		setLiqPrice(0n);
	};

	const onChangeInterest = (value: string) => {
		const valueBigInt = BigInt(value);
		setInterest(valueBigInt);

		if (valueBigInt > 100_0000n) {
			setInterestError(t("mint.error.annual_interest_rate_exceeded", { rate: 100 }));
		} else {
			setInterestError("");
		}
	};

	const onChangeMaturity = (value: string) => {
		const valueBigInt = BigInt(value);
		setMaturity(valueBigInt);
	};

	const onChangeInitPeriod = (value: string) => {
		const valueBigInt = BigInt(value);
		setInitPeriod(valueBigInt);
		if (valueBigInt < 3n) {
			setInitError(t("mint.error.initialization_period_too_short", { days: 3 }));
		} else {
			setInitError("");
		}
	};

	const onChangeLiqPrice = (value: string) => {
		const valueBigInt = BigInt(value);
		setLiqPrice(valueBigInt);
		checkCollateralAmount(minCollAmount, valueBigInt);
	};

	function checkCollateralAmount(coll: bigint, price: bigint) {
		if (coll * price < 10n ** 36n) {
			setLiqPriceError(t("mint.error.liquidation_value_too_low", { amount: 5000, symbol: TOKEN_SYMBOL }));
			setMinCollAmountError(t("mint.error.collateral_value_too_low", { amount: 5000, symbol: TOKEN_SYMBOL }));
		} else {
			setLiqPriceError("");
			setMinCollAmountError("");
		}
	}

	const onChangeBuffer = (value: string) => {
		const valueBigInt = BigInt(value);
		setBuffer(valueBigInt);
		if (valueBigInt > 1000_000n) {
			setBufferError(t("mint.error.buffer_too_high", { amount: 100 }));
		} else if (valueBigInt < 100_000) {
			setBufferError(t("mint.error.buffer_too_low", { amount: 10 }));
		} else {
			setBufferError("");
		}
	};

	const onChangeAuctionDuration = (value: string) => {
		const valueBigInt = BigInt(value);
		setAuctionDuration(valueBigInt);
		if (valueBigInt < 1n) {
			setDurationError(t("mint.error.duration_too_short", { hours: 1 }));
		} else {
			setDurationError("");
		}
	};

	const hasFormError = () => {
		return (
			!!minCollAmountError ||
			!!initialCollAmountError ||
			!!collTokenAddrError ||
			!!limitAmountError ||
			!!interestError ||
			!!liqPriceError ||
			!!bufferError ||
			!!durationError ||
			!!initError
		);
	};

	const handleApprove = async () => {
		try {
			setIsConfirming("approve");

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: collTokenData.address,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].mintingHubGateway, maxUint256],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: "infinite " + collTokenData.symbol,
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
					render: <TxToast title={t("common.txs.title", { symbol: collTokenData.symbol })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("common.txs.success", { symbol: collTokenData.symbol })} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: Need translation
		} finally {
			setIsConfirming("");
		}
	};

	const handleApproveDeuro = async () => {
		try {
			setIsConfirming("approveDeuro");

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].decentralizedEURO,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].mintingHubGateway, maxUint256],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: "infinite " + TOKEN_SYMBOL,
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
					render: <TxToast title={t("common.txs.title", { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("common.txs.success", { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
			});

			await refetchDeuroAllowance();
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: Need translation
		} finally {
			setIsConfirming("");
		}
	};

	const handleOpenPosition = async () => {
		try {
			setIsConfirming("open");
			const openWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].mintingHubGateway,
				abi: MintingHubGatewayABI,
				functionName: "openPosition",
				args: [
					collTokenData.address,
					minCollAmount,
					initialCollAmount,
					limitAmount,
					parseInt(initPeriod.toString()) * 24 * 60 * 60,
					parseInt(maturity.toString()) * 86400 * 30,
					parseInt(auctionDuration.toString()) * 60 * 60,
					Number(interest),
					liqPrice,
					Number(buffer),
				],
			});

			const toastContent = [
				{
					title: t("mint.collateral"),
					value: shortenAddress(collTokenData.address),
				},
				{
					title: t("mint.collateral_amount"),
					value: formatBigInt(initialCollAmount, parseInt(collTokenData.decimals.toString())) + " " + collTokenData.symbol,
				},
				{
					title: t("mint.liquidation_price"),
					value: formatBigInt(liqPrice, 36 - parseInt(collTokenData.decimals.toString())) + ` ${TOKEN_SYMBOL}`,
				},
				{
					title: t("common.txs.transaction"),
					hash: openWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: openWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("mint.txs.creating_position")} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("mint.txs.position_created")} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: Need translation
		} finally {
			setIsConfirming("");
		}
	};

	return (
		<>
			<Head>
				<title>dEURO - {t("mint.propose_position")}</title>
			</Head>

			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold justify-center mt-3 flex">{t("mint.proposal_process")}</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
							<TokenInput
								label={t("mint.proposal_fee")}
								symbol={TOKEN_SYMBOL}
								hideMaxLabel
								value={proposalFee.toString()}
								onChange={onChangeProposalFee}
								digit={0}
								error={
									userBalance.deuroBalance < BigInt(1000 * 1e18)
										? t("common.error.not_enough", { symbol: TOKEN_SYMBOL })
										: ""
								}
								disabled={true}
							/>
							<NormalInput
								label={t("mint.initialization_period")}
								symbol={t("common.days")}
								error={initError}
								digit={0}
								hideMaxLabel
								value={initPeriod.toString()}
								onChange={onChangeInitPeriod}
								placeholder={t("mint.initialization_period")}
							/>
						</div>
						<div>
							<Trans i18nKey="mint.discuss_recommendation">
								<Link href={SOCIAL.Forum} target="_blank">
									discuss
								</Link>
							</Trans>
						</div>
					</div>

					{/* Collateral */}
					<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold justify-center mt-3 flex">{t("mint.collateral")}</div>

						<AddressInput
							label={t("mint.collateral_token")}
							error={collTokenAddrError}
							placeholder={t("mint.token_contract_address")}
							value={collateralAddress}
							onChange={onChangeCollateralAddress}
						/>
						{collTokenData.symbol != "NaN" && initialCollAmount > userAllowance ? (
							<Button
								isLoading={isConfirming == "approve"}
								disabled={
									collTokenData.symbol == "NaN" || (userAllowance > minCollAmount && userAllowance > initialCollAmount)
								}
								onClick={() => handleApprove()}
							>
								{collTokenData.symbol == "NaN"
									? t("common.approve")
									: t("mint.approve_handling", { symbol: collTokenData.symbol })}
							</Button>
						) : (
							""
						)}
						<TokenInput
							label={t("mint.minimum_collateral")}
							symbol={collTokenData.symbol}
							error={minCollAmountError}
							hideMaxLabel
							value={minCollAmount.toString()}
							onChange={onChangeMinCollAmount}
							digit={collTokenData.decimals}
							placeholder={t("mint.minimum_collateral_amount")}
						/>
						<TokenInput
							balanceLabel={t("common.balance_label") + " "}
							label={t("mint.initial_collateral")}
							symbol={collTokenData.symbol}
							error={initialCollAmountError}
							max={collTokenData.balance}
							value={initialCollAmount.toString()}
							onChange={onChangeInitialCollAmount}
							digit={collTokenData.decimals}
							placeholder={t("mint.initial_collateral_amount")}
						/>
					</div>
					<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center mt-3">{t("mint.financial_terms")}</div>
						<TokenInput
							label={t("mint.global_minting_limit")}
							hideMaxLabel
							symbol={TOKEN_SYMBOL}
							error={limitAmountError}
							value={limitAmount.toString()}
							onChange={onChangeLimitAmount}
							placeholder={t("mint.global_limit_amount")}
						/>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
							<NormalInput
								label={t("mint.risk_premium")}
								symbol="%"
								error={interestError}
								digit={4}
								hideMaxLabel
								value={interest.toString()}
								onChange={onChangeInterest}
								placeholder={t("mint.risk_premium_percent")}
							/>
							<NormalInput
								label={t("mint.maturity")}
								symbol={t("common.months")}
								hideMaxLabel
								digit={0}
								value={maturity.toString()}
								onChange={onChangeMaturity}
								placeholder={t("mint.maturity")}
							/>
						</div>
					</div>
					<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center mt-3">{t("mint.liquidation")}</div>
						<TokenInput
							label={t("mint.liquidation_price")}
							balanceLabel={t("common.pick")}
							symbol={TOKEN_SYMBOL}
							error={liqPriceError}
							digit={36n - collTokenData.decimals}
							hideMaxLabel={minCollAmount == 0n}
							max={minCollAmount == 0n ? 0n : (5000n * 10n ** 36n + minCollAmount - 1n) / minCollAmount}
							value={liqPrice.toString()}
							onChange={onChangeLiqPrice}
							placeholder={t("common.price")}
						/>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
							<NormalInput
								label={t("mint.retained_reserve")}
								symbol="%"
								error={bufferError}
								digit={4}
								hideMaxLabel
								value={buffer.toString()}
								onChange={onChangeBuffer}
								placeholder={t("common.percent")}
							/>
							<NormalInput
								label={t("mint.auction_duration")}
								symbol={t("common.hours")}
								error={durationError}
								hideMaxLabel
								digit={0}
								value={auctionDuration.toString()}
								onChange={onChangeAuctionDuration}
								placeholder={t("mint.auction_duration")}
							/>
						</div>
					</div>
				</section>
				<div className="mx-auto mt-8 w-72 max-w-full flex-col">
					<GuardToAllowedChainBtn label={t("mint.propose_position")}>
						{deuroAllowance < BigInt(1000 * 1e18) ? (
							<Button
								disabled={hasFormError()}
								isLoading={isConfirming == "approveDeuro"}
								onClick={() => handleApproveDeuro()}
							>
								{t("common.approve")}
							</Button>
						) : (
							<Button
								disabled={
									minCollAmount == 0n || userAllowance < initialCollAmount || initialCollAmount == 0n || hasFormError()
								}
								isLoading={isConfirming == "open"}
								onClick={() => handleOpenPosition()}
							>
								{t("mint.propose_position")}
							</Button>
						)}
					</GuardToAllowedChainBtn>
				</div>
			</div>
		</>
	);
}

export async function getStaticProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ["common"])),
		},
	};
}
