import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { formatUnits, maxUint256, erc20Abi, Hash, zeroHash } from "viem";
import TokenInput from "@components/Input/TokenInput";
import { useState } from "react";
import Button from "@components/Button";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { Address } from "viem";
import { formatBigInt, formatCurrency, min, shortenAddress, TOKEN_SYMBOL, toTimestamp } from "@utils";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast, renderErrorTxStackToast, renderErrorTxToast } from "@components/TxToast";
import DateInput from "@components/Input/DateInput";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import Link from "next/link";
import { ADDRESS, MintingHubGatewayABI, MintingHubV2ABI } from "@deuro/eurocoin";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useFrontendCode } from "../../../hooks/useFrontendCode";

export default function PositionBorrow({}) {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [errorDate, setErrorDate] = useState("");
	const [isInit, setInit] = useState<boolean>(false);
	const [isApproving, setApproving] = useState(false);
	const [isCloning, setCloning] = useState(false);
	const [expirationDate, setExpirationDate] = useState<Date>(new Date(0));

	const [userAllowance, setUserAllowance] = useState(0n);
	const [userBalance, setUserBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const account = useAccount();
	const router = useRouter();

	const chainId = useChainId();
	const addressQuery: Address = router.query.address as Address;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == addressQuery);

	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const { frontendCode } = useFrontendCode();
	const { t } = useTranslation();

	// ---------------------------------------------------------------------------
	useEffect(() => {
		if (isInit) return;
		if (!position || position.expiration == 0) return;
		setExpirationDate(toDate(position.expiration));

		if (!amount) {
			const initMintAmount: bigint = BigInt(formatUnits(BigInt(position.price) * BigInt(position.minimumCollateral), 18));
			setAmount(initMintAmount);
		}

		setInit(true);
	}, [position, amount, expirationDate, isInit]);

	useEffect(() => {
		const acc: Address | undefined = account.address;
		if (acc === undefined) return;
		if (!position || !position.collateral) return;

		const fetchAsync = async function () {
			const _balance = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [acc],
			});
			setUserBalance(_balance);

			const _allowance = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				abi: erc20Abi,
				functionName: "allowance",
				args: [acc, ADDRESS[WAGMI_CHAIN.id].mintingHubGateway],
			});
			setUserAllowance(_allowance);
		};

		fetchAsync();
	}, [data, account.address, position]);

	// ---------------------------------------------------------------------------
	// dont continue if position not loaded correctly
	if (!position) return null;

	const price: number = parseFloat(formatUnits(BigInt(position.price), 36 - position.collateralDecimals));
	const collateralPriceDeuro: number = prices[position.collateral.toLowerCase() as Address]?.price?.eur || 1;
	const interest: number = position.annualInterestPPM / 10 ** 6;
	const reserve: number = position.reserveContribution / 10 ** 6;
	const effectiveLTV: number = (price * (1 - reserve)) / collateralPriceDeuro;
	const effectiveInterest: number = interest / (1 - reserve);

	const requiredColl =
		BigInt(position.price) > 0 &&
		(BigInt(1e18) * amount + BigInt(position.price) - 1n) / BigInt(position.price) > BigInt(position.minimumCollateral)
			? (BigInt(1e18) * amount + BigInt(position.price) - 1n) / BigInt(position.price)
			: BigInt(position.minimumCollateral);

	const borrowersReserveContribution = (BigInt(position.reserveContribution) * amount) / 1_000_000n;

	function toDate(time: bigint | number | string) {
		const v: bigint = BigInt(time);
		return new Date(Number(v) * 1000);
	}

	// max(4 weeks, ((chosen expiration) - (current block))) * position.annualInterestPPM() / (365 days) / 1000000
	const feePercent =
		(BigInt(Math.max(60 * 60 * 24 * 30, Math.floor((expirationDate.getTime() - Date.now()) / 1000))) *
			BigInt(position.annualInterestPPM)) /
		BigInt(60 * 60 * 24 * 365);
	const fees = (feePercent * amount) / 1_000_000n;
	const paidOutToWallet = amount - borrowersReserveContribution - fees;
	const paidOutToWalletPct = (parseInt(paidOutToWallet.toString()) * 100) / parseInt(amount.toString());
	const availableAmount = BigInt(position.availableForClones);
	const userValue = (userBalance * BigInt(position.price)) / BigInt(1e18);
	const borrowingLimit = min(availableAmount, userValue);

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (valueBigInt > borrowingLimit) {
			if (availableAmount < valueBigInt) {
				setError(t('mint.minting_limit_exceeded', { amount: formatCurrency(parseInt(borrowingLimit.toString()) / 1e18, 2, 2), symbol: TOKEN_SYMBOL }));
			} else if (availableAmount > userValue) {
				setError(t('common.error.insufficient_balance', { symbol: position.collateralSymbol }));
			}
		} else {
			setError("");
		}
	};

	const onChangeCollateral = (value: string) => {
		const valueBigInt = (BigInt(value) * BigInt(position.price)) / BigInt(1e18);
		if (valueBigInt > borrowingLimit) {
			setError(t('mint.minting_limit_exceeded', { amount: formatCurrency(parseInt(borrowingLimit.toString()) / 1e18, 2, 2), symbol: TOKEN_SYMBOL }));
		} else {
			setError("");
		}
		setAmount(valueBigInt);
	};

	const onChangeExpiration = (value: Date | null) => {
		if (!value) value = new Date();
		const newTimestamp = toTimestamp(value);
		const bottomLimit = toTimestamp(new Date());
		const uppperLimit = position.expiration;

		if (newTimestamp < bottomLimit || newTimestamp > uppperLimit) {
			setErrorDate(t('mint.expiration_date_out_of_range'));
		} else {
			setErrorDate("");
		}
		setExpirationDate(value);
	};

	const onMaxExpiration = () => {
		setExpirationDate(toDate(position.expiration));
	};

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.collateral as Address,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].mintingHubGateway, maxUint256],
			});

			const toastContent = [
				{
					title: t('common.txs.amount'),
					value: "infinite " + position.collateralSymbol,
				},
				{
					title: t('common.txs.spender'),
					value: shortenAddress(ADDRESS[chainId].mintingHubGateway),
				},
				{
					title: t('common.txs.transaction'),
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t('common.txs.title', { symbol: position.collateralSymbol })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t('common.txs.success', { symbol: position.collateralSymbol })} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			setApproving(false);
		}
	};

	const handleClone = async () => {
		try {
			setCloning(true);
			const expirationTime = toTimestamp(expirationDate);
			let cloneWriteHash: Hash = zeroHash;

			cloneWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].mintingHubGateway,
				abi: MintingHubGatewayABI,
				functionName: "clone",
				args: [position.position, requiredColl, amount, expirationTime, frontendCode],
			});

			const toastContent = [
				{
					title: t('common.txs.amount'),
					value: formatBigInt(amount) + ` ${TOKEN_SYMBOL}`,
				},
				{
					title: t('common.txs.collateral'),
					value: formatBigInt(requiredColl, position.collateralDecimals) + " " + position.collateralSymbol,
				},
				{
					title: t('common.txs.transaction'),
					hash: cloneWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: cloneWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t('mint.txs.minting', { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t('mint.txs.minting_success', { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			setCloning(false);
		}
	};

	return (
		<>
			<Head>
				<title>dEURO - {t('mint.mint')}</title>
			</Head>

			<div className="mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center mt-3">{t('mint.mint_title')}</div>
						<div className="space-y-8">
							<TokenInput
								label={t('mint.mint_amount')}
								balanceLabel={t('common.limit_label')}
								symbol={TOKEN_SYMBOL}
								max={availableAmount}
								value={amount.toString()}
								onChange={onChangeAmount}
								placeholder={t('mint.input_placeholder')}
							/>
							<TokenInput
								label={t('mint.required_collateral')}
								balanceLabel={t('common.your_balance')}
								max={userBalance}
								digit={position.collateralDecimals}
								onChange={onChangeCollateral}
								output={formatUnits(requiredColl, position.collateralDecimals)}
								symbol={position.collateralSymbol}
							/>
							<DateInput label={t('mint.expiration')} max={position.expiration} value={expirationDate} onChange={onChangeExpiration} />
						</div>
						<div className="mx-auto mt-8 w-72 max-w-full flex-col">
							<GuardToAllowedChainBtn label={amount > userAllowance ? t('common.approve') : t('mint.mint')}>
								{requiredColl > userAllowance ? (
									<Button
										disabled={amount == 0n || requiredColl > userBalance || !!error}
										isLoading={isApproving}
										onClick={() => handleApprove()}
									>
										{t('common.approve')}
									</Button>
								) : (
									<Button
										disabled={amount == 0n || requiredColl > userBalance || !!error}
										isLoading={isCloning}
										onClick={() => handleClone()}
									>
										{t('mint.mint')}
									</Button>
								)}
								<p className="text-text-warning">{errorDate}</p>
								<p className="text-text-warning">{error}</p>
							</GuardToAllowedChainBtn>
						</div>
					</div>
					<div>
						<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col">
							<div className="text-lg font-bold text-center mt-3">{t('mint.outcome')}</div>
							<div className="flex-1 mt-4">
								<div className="flex">
									<div className="flex-1">
										<span>{t('mint.sent_to_your_wallet')}</span>
									</div>
									<div className="text-right">
										<span className="text-xs mr-3">{formatCurrency(paidOutToWalletPct)}%</span>
										<span>{formatCurrency(formatUnits(paidOutToWallet, 18))} {TOKEN_SYMBOL}</span>
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">
										<span>{t('mint.retained_reserve')}</span>
									</div>
									<div className="text-right">
										<span className="text-xs mr-3">{formatCurrency(position.reserveContribution / 10000, 2, 2)}%</span>
										<span>{formatCurrency(formatUnits(borrowersReserveContribution, 18))} {TOKEN_SYMBOL}</span>
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">
										<span>{t('mint.upfront_interest')}</span>
										<div className="text-xs">({position.annualInterestPPM / 10000}% {t('mint.per_year')})</div>
									</div>
									<div className="text-right">
										<span className="text-xs mr-3">{formatBigInt(feePercent, 4)}%</span>
										<span>{formatCurrency(formatUnits(fees, 18))} {TOKEN_SYMBOL}</span>
									</div>
								</div>

								<hr className="mt-4 border-slate-700 border-dashed" />

								<div className="mt-2 flex font-bold">
									<div className="flex-1">
										<span>{t('mint.total')}</span>
									</div>
									<div className="text-right">
										<span className="text-xs mr-3">100%</span>
										<span>{formatCurrency(formatUnits(amount, 18))} {TOKEN_SYMBOL}</span>
									</div>
								</div>
							</div>
						</div>
						<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col mt-4">
							<div className="text-lg font-bold text-center mt-3">Notes</div>
							<div className="flex-1 mt-4">
								<div className="mt-2 flex">
									<div className="flex-1">{t('mint.effective_annual_interest')}</div>
									<div className="">{formatCurrency(effectiveInterest * 100)}%</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">{t('mint.liquidation_price')}</div>
									<div className="">
										{formatCurrency(formatUnits(BigInt(position.price), 36 - position.collateralDecimals))} {TOKEN_SYMBOL}
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">{t('mint.market_price')}</div>
									<div className="">{formatCurrency(collateralPriceDeuro)} {TOKEN_SYMBOL}</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">{t('mint.loan_to_value')}</div>
									<div className="">{formatCurrency(effectiveLTV * 100)}%</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">{t('mint.parent_position')}</div>
									<Link className="underline" href={`/monitoring/${position.original}`}>
										{shortenAddress(position.original)}
									</Link>
								</div>

								<p className="mt-4">
									{t('mint.while_the_maturity_is_fixed')}
								</p>
							</div>
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
