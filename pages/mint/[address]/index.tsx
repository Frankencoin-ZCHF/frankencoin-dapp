import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { formatUnits, maxUint256, erc20Abi } from "viem";
import TokenInput from "@components/Input/TokenInput";
import { useState } from "react";
import Button from "@components/Button";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { Address } from "viem";
import { formatBigInt, formatCurrency, min, shortenAddress, toTimestamp } from "@utils";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast, renderErrorTxToast } from "@components/TxToast";
import DateInput from "@components/Input/DateInput";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import Link from "next/link";
import { ADDRESS, MintingHubV1ABI, MintingHubV2ABI } from "@frankencoin/zchf";

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
				args: [acc, position.version == 1 ? ADDRESS[WAGMI_CHAIN.id].mintingHubV1 : ADDRESS[WAGMI_CHAIN.id].mintingHubV2],
			});
			setUserAllowance(_allowance);
		};

		fetchAsync();
	}, [data, account.address, position]);

	// ---------------------------------------------------------------------------
	// dont continue if position not loaded correctly
	if (!position) return null;

	const price: number = parseFloat(formatUnits(BigInt(position.price), 36 - position.collateralDecimals));
	const collateralPriceZchf: number = prices[position.collateral.toLowerCase() as Address].price.chf || 1;
	const interest: number = position.annualInterestPPM / 10 ** 6;
	const reserve: number = position.reserveContribution / 10 ** 6;
	const effectiveLTV: number = (price * (1 - reserve)) / collateralPriceZchf;
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
				setError("Can not mint more than " + formatCurrency(parseInt(borrowingLimit.toString()) / 1e18, 2, 2) + " ZCHF");
			} else if (availableAmount > userValue) {
				setError(`Not enough ${position.collateralSymbol} in your wallet.`);
			}
		} else {
			setError("");
		}
	};

	const onChangeCollateral = (value: string) => {
		const valueBigInt = (BigInt(value) * BigInt(position.price)) / BigInt(1e18);
		if (valueBigInt > borrowingLimit) {
			setError("Can not mint more than " + formatCurrency(parseInt(borrowingLimit.toString()) / 1e18, 2, 2) + " ZCHF");
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
			setErrorDate("Expiration Date should be between Now and Limit");
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
				args: [position.version == 1 ? ADDRESS[chainId].mintingHubV1 : ADDRESS[chainId].mintingHubV2, maxUint256],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: "infinite " + position.collateralSymbol,
				},
				{
					title: "Spender: ",
					value: shortenAddress(ADDRESS[chainId].mintingHubV1),
				},
				{
					title: "Transaction:",
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Approving ${position.collateralSymbol}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully Approved ${position.collateralSymbol}`} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleClone = async () => {
		try {
			setCloning(true);
			const expirationTime = toTimestamp(expirationDate);

			const cloneWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.version == 1 ? ADDRESS[chainId].mintingHubV1 : ADDRESS[chainId].mintingHubV2,
				abi: position.version == 1 ? MintingHubV1ABI : MintingHubV2ABI,
				functionName: "clone",
				args: [position.position, requiredColl, amount, BigInt(expirationTime)],
			});

			const toastContent = [
				{
					title: `Amount: `,
					value: formatBigInt(amount) + " ZCHF",
				},
				{
					title: `Collateral: `,
					value: formatBigInt(requiredColl, position.collateralDecimals) + " " + position.collateralSymbol,
				},
				{
					title: "Transaction:",
					hash: cloneWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: cloneWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Minting ZCHF`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Minted ZCHF" rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setCloning(false);
		}
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Mint</title>
			</Head>

			<div className="mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center mt-3">Mint Frankencoins For Yourself</div>
						<div className="space-y-8">
							<TokenInput
								label="Mint Amount"
								balanceLabel="Limit:"
								symbol="ZCHF"
								max={availableAmount}
								value={amount.toString()}
								onChange={onChangeAmount}
								placeholder="Total Amount to be Minted"
							/>
							<TokenInput
								label="Required Collateral"
								balanceLabel="Your balance:"
								max={userBalance}
								digit={position.collateralDecimals}
								onChange={onChangeCollateral}
								output={formatUnits(requiredColl, position.collateralDecimals)}
								symbol={position.collateralSymbol}
							/>
							<DateInput label="Expiration" max={position.expiration} value={expirationDate} onChange={onChangeExpiration} />
						</div>
						<div className="mx-auto mt-8 w-72 max-w-full flex-col">
							<GuardToAllowedChainBtn>
								{requiredColl > userAllowance ? (
									<Button
										disabled={amount == 0n || requiredColl > userBalance || !!error}
										isLoading={isApproving}
										onClick={() => handleApprove()}
									>
										Approve
									</Button>
								) : (
									<Button
										disabled={amount == 0n || requiredColl > userBalance || !!error}
										isLoading={isCloning}
										onClick={() => handleClone()}
									>
										Mint
									</Button>
								)}
								<p className="text-text-warning">{errorDate}</p>
								<p className="text-text-warning">{error}</p>
							</GuardToAllowedChainBtn>
						</div>
					</div>
					<div>
						<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col">
							<div className="text-lg font-bold text-center mt-3">Outcome</div>
							<div className="flex-1 mt-4">
								<div className="flex">
									<div className="flex-1">
										<span>Sent to your wallet</span>
									</div>
									<div className="text-right">
										<span className="text-xs mr-3">{formatCurrency(paidOutToWalletPct)}%</span>
										<span>{formatCurrency(formatUnits(paidOutToWallet, 18))} ZCHF</span>
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">
										<span>Retained Reserve</span>
									</div>
									<div className="text-right">
										<span className="text-xs mr-3">{formatCurrency(position.reserveContribution / 10000, 2, 2)}%</span>
										<span>{formatCurrency(formatUnits(borrowersReserveContribution, 18))} ZCHF</span>
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">
										<span>Upfront interest</span>
										<div className="text-xs">({position.annualInterestPPM / 10000}% per year)</div>
									</div>
									<div className="text-right">
										<span className="text-xs mr-3">{formatBigInt(feePercent, 4)}%</span>
										<span>{formatCurrency(formatUnits(fees, 18))} ZCHF</span>
									</div>
								</div>

								<hr className="mt-4 border-slate-700 border-dashed" />

								<div className="mt-2 flex font-bold">
									<div className="flex-1">
										<span>Total</span>
									</div>
									<div className="text-right">
										<span className="text-xs mr-3">100%</span>
										<span>{formatCurrency(formatUnits(amount, 18))} ZCHF</span>
									</div>
								</div>
							</div>
						</div>
						<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col mt-4">
							<div className="text-lg font-bold text-center mt-3">Notes</div>
							<div className="flex-1 mt-4">
								<div className="mt-2 flex">
									<div className="flex-1">Effective Annual Interest</div>
									<div className="">{formatCurrency(effectiveInterest * 100)}%</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">Liquidation Price</div>
									<div className="">
										{formatCurrency(formatUnits(BigInt(position.price), 36 - position.collateralDecimals))} ZCHF
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">Market Price</div>
									<div className="">{formatCurrency(collateralPriceZchf)} ZCHF</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">Loan-To-Value</div>
									<div className="">{formatCurrency(effectiveLTV * 100)}%</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">Parent Position</div>
									<Link className="underline" href={`/monitoring/${position.original}`}>
										{shortenAddress(position.original)}
									</Link>
								</div>

								<p className="mt-4">
									While the maturity is fixed, you can adjust the liquidation price and the collateral amount later as
									long as it covers the minted amount. No interest will be refunded when repaying earlier.
								</p>
							</div>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}
