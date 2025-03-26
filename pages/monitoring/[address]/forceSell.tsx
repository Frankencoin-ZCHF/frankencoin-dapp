import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AppBox from "@components/AppBox";
import TokenInput from "@components/Input/TokenInput";
import DisplayAmount from "@components/DisplayAmount";
import { Address, formatUnits, zeroAddress } from "viem";
import { ContractUrl, formatBigInt, formatCurrency, formatDate, shortenAddress, TOKEN_SYMBOL } from "@utils";
import Link from "next/link";
import Button from "@components/Button";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import DisplayLabel from "@components/DisplayLabel";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../../app.config";
import { RootState } from "../../../redux/redux.store";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { useRouter as useNavigation } from "next/navigation";
import { ADDRESS, DecentralizedEUROABI, MintingHubV2ABI } from "@deuro/eurocoin";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

export default function MonitoringForceSell() {
	const [isInit, setInit] = useState(false);
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isBidding, setBidding] = useState(false);
	const [isNavigating, setNavigating] = useState(false);
	const [userBalance, setUserBalance] = useState(0n);
	const [auctionPrice, setAuctionPrice] = useState<bigint>(0n);

	const { data } = useBlockNumber({ watch: true });
	const account = useAccount();
	const router = useRouter();
	const navigate = useNavigation();
	const { t } = useTranslation();

	const chainId = useChainId();
	const queryAddress: Address = (String(router.query.address) as Address) || zeroAddress;
	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position.toLowerCase() == queryAddress.toLowerCase());

	useEffect(() => {
		const acc: Address | undefined = account.address;
		const ADDR = ADDRESS[WAGMI_CHAIN.id];
		if (position === undefined) return;

		const fetchAsync = async function () {
			if (acc !== undefined) {
				const _balance = await readContract(WAGMI_CONFIG, {
					address: ADDR.decentralizedEURO,
					abi: DecentralizedEUROABI,
					functionName: "balanceOf",
					args: [acc],
				});
				setUserBalance(_balance);
			}

			const _price = await readContract(WAGMI_CONFIG, {
				address: ADDR.mintingHubGateway,
				abi: MintingHubV2ABI,
				functionName: "expiredPurchasePrice",
				args: [position.position],
			});
			setAuctionPrice(_price);
		};

		fetchAsync();
	}, [data, position, account.address]);

	useEffect(() => {
		if (isInit) return;
		if (position === undefined) return;
		setAmount(BigInt(position.collateralBalance));

		setInit(true);
	}, [isInit, position]);

	useEffect(() => {
		if (isNavigating && position?.position) {
			navigate.push(`/mypositions`);
		}
	}, [isNavigating, navigate, position]);

	if (!position) return null;

	const start: number = position.expiration * 1000; // timestamp when expired
	const duration: number = position.challengePeriod * 1000;

	const declineOnePriceTimestamp = start + duration;
	const zeroPriceTimestamp = start + 2 * duration;

	const expectedEURO = (bidAmount?: bigint) => {
		if (!bidAmount) bidAmount = amount;
		return (bidAmount * auctionPrice) / BigInt(1e18);
	};

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);

		if (expectedEURO() > userBalance) {
			setError(t("monitoring.error.not_enough_collateral", { symbol: TOKEN_SYMBOL }));
		} else if (valueBigInt > BigInt(position.collateralBalance)) {
			setError(t("monitoring.error.expected_buying_collateral"));
		} else {
			setError("");
		}
	};

	const handleBid = async () => {
		try {
			setBidding(true);

			const bidWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].mintingHubGateway,
				abi: MintingHubV2ABI,
				functionName: "buyExpiredCollateral",
				args: [position.position, amount],
			});

			const toastContent = [
				{
					title: t("monitoring.txs.force_sell"),
					value: formatBigInt(amount, position.collateralDecimals) + " " + position.collateralSymbol,
				},
				{
					title: t("monitoring.txs.expected_euro", { symbol: TOKEN_SYMBOL }),
					value: formatCurrency(formatUnits(expectedEURO(), 18)) + " " + TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.transaction"),
					hash: bidWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: bidWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("monitoring.txs.force_sell_pending", { symbol: position.collateralSymbol })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("monitoring.txs.force_sell_success")} rows={toastContent} />,
				},
			});
			setNavigating(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			setBidding(false);
		}
	};

	return (
		<>
			<Head>
				<title>dEURO - {t("monitoring.force_sell_title")}</title>
			</Head>

			<div className="md:mt-8">
				<section className="mx-auto max-w-2xl sm:px-8">
					<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center mt-3">{t("monitoring.force_sell_description", { symbol: position.collateralSymbol })}</div>

						<div className="">
							<TokenInput
								label=""
								max={BigInt(position.collateralBalance)}
								value={amount.toString()}
								onChange={onChangeAmount}
								digit={position.collateralDecimals}
								symbol={position.collateralSymbol}
								error={error}
								placeholder={t("common.input_placeholder")}
								balanceLabel={t("common.available_label")}
							/>
							<div className="flex flex-col">
								<span>{t("common.your_balance")} {formatCurrency(formatUnits(userBalance, 18), 2, 2)} {TOKEN_SYMBOL}</span>
							</div>
							<div className="flex flex-col">
								<span>{t("common.estimated_cost")} {formatCurrency(formatUnits(expectedEURO(), 18), 2, 2)} {TOKEN_SYMBOL}</span>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:col-span-2">
							<AppBox>
								<DisplayLabel label={t("common.available")} />
								<DisplayAmount
									amount={BigInt(position.collateralBalance)}
									currency={position.collateralSymbol}
									address={position.collateral}
									digits={position.collateralDecimals}
									className="mt-4"
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label={t("common.price_per_unit")} />
								<DisplayAmount
									amount={auctionPrice}
									digits={36 - position.collateralDecimals}
									address={ADDRESS[chainId].decentralizedEURO}
									currency={TOKEN_SYMBOL}
									className="mt-4"
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label={t("common.owner")} />
								<Link
									className="text-link"
									href={ContractUrl(position.owner, WAGMI_CHAIN)}
									target="_blank"
									rel="noreferrer"
								>
									<div className="">
										{shortenAddress(position.owner)}
										<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
									</div>
								</Link>
							</AppBox>
							<AppBox>
								<DisplayLabel label={t("common.position")} />
								<Link className="text-link" href={`/monitoring/${position.position}`}>
									<div className="">{shortenAddress(position.position)}</div>
								</Link>
							</AppBox>
							<AppBox>
								<DisplayLabel label={t("monitoring.from_10x_price_decline_until")} />
								<div>{formatDate(declineOnePriceTimestamp / 1000) || "---"}</div>
							</AppBox>
							<AppBox>
								<DisplayLabel label={t("monitoring.reaching_zero_at")} />
								{formatDate(zeroPriceTimestamp / 1000) || "---"}
							</AppBox>
						</div>
						<div className="mx-auto mt-4 w-72 max-w-full flex-col">
							{/* Override lable here */}
							<GuardToAllowedChainBtn label={t("monitoring.force_sell_title")}>
								<Button
									disabled={amount == 0n || expectedEURO() > userBalance || error != ""}
									isLoading={isBidding}
									onClick={() => handleBid()}
								>
									{t("monitoring.force_sell_title")}
								</Button>
							</GuardToAllowedChainBtn>
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