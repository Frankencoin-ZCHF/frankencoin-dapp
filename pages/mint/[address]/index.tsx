import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { formatUnits, getAddress, zeroAddress, maxUint256, erc20Abi } from "viem";
import TokenInput from "@components/Input/TokenInput";
import { useState } from "react";
import DisplayAmount from "@components/DisplayAmount";
import Button from "@components/Button";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ABIS, ADDRESS } from "@contracts";
import { Address } from "viem";
import { formatBigInt, formatCurrency, min, shortenAddress, toTimestamp } from "@utils";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast } from "@components/TxToast";
import AppBox from "@components/AppBox";
import DateInput from "@components/Input/DateInput";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";

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
		const fc: Address = ADDRESS[WAGMI_CHAIN.id].frankenCoin;
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
				args: [acc, ADDRESS[WAGMI_CHAIN.id].mintingHub],
			});
			setUserAllowance(_allowance);
		};

		fetchAsync();
	}, [data, account.address, position]);

	// ---------------------------------------------------------------------------
	// dont continue if position not loaded correctly
	if (!position) return null;

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
	const availableAmount = BigInt(position.availableForClones);
	const userValue = (userBalance * BigInt(position.price)) / BigInt(1e18);
	const borrowingLimit = min(availableAmount, userValue);

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (valueBigInt > borrowingLimit) {
			if (availableAmount > userValue) {
				setError(`Not enough ${position.collateralSymbol} in your wallet.`);
			} else {
				setError("Not enough ZCHF available for this position.");
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
				args: [ADDRESS[chainId].mintingHub, maxUint256],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: "infinite " + position.collateralSymbol,
				},
				{
					title: "Spender: ",
					value: shortenAddress(ADDRESS[chainId].mintingHub),
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
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setApproving(false);
		}
	};

	const handleClone = async () => {
		try {
			setCloning(true);
			const expirationTime = toTimestamp(expirationDate);

			const cloneWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].mintingHub,
				abi: ABIS.MintingHubABI,
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
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setCloning(false);
		}
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Mint</title>
			</Head>

			<div>
				<AppPageHeader title="Mint Frankencoins For Yourself" />
			</div>

			<div className="mt-8">
				{/* <AppPageHeader title="Mint Frankencoins for Yourself" backText="Back to Overview" backTo="/mint" /> */}

				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center mt-3">Minting Amount and Collateral</div>
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
										variant="primary"
										disabled={amount == 0n || requiredColl > userBalance || !!error}
										isLoading={isCloning}
										onClick={() => handleClone()}
										error={errorDate ?? error}
									>
										Clone and Borrow
									</Button>
								)}
							</GuardToAllowedChainBtn>
						</div>
					</div>
					<div>
						<div className="bg-slate-950 rounded-xl p-4 flex flex-col">
							<div className="text-lg font-bold text-center mt-3">Outcome</div>
							<div className="bg-slate-900 rounded-xl p-4 flex flex-col gap-2">
								<div className="flex">
									<div className="flex-1">Sent to your wallet</div>
									<DisplayAmount
										amount={paidOutToWallet}
										currency="ZCHF"
										address={ADDRESS[chainId].frankenCoin}
										hideLogo
									/>
								</div>
								<div className="flex">
									<div className="flex-1">Locked in borrowers reserve</div>
									<DisplayAmount
										amount={borrowersReserveContribution}
										currency="ZCHF"
										address={ADDRESS[chainId].frankenCoin}
										hideLogo
									/>
								</div>
								<div className="flex">
									<div className="flex-1">Fees ({formatBigInt(feePercent, 4)}%)</div>
									<DisplayAmount amount={fees} currency="ZCHF" address={ADDRESS[chainId].frankenCoin} hideLogo />
								</div>
								<hr className="border-slate-700 border-dashed" />
								<div className="flex font-bold">
									<div className="flex-1">Total</div>
									<DisplayAmount amount={amount} currency="ZCHF" address={ADDRESS[chainId].frankenCoin} hideLogo />
								</div>
							</div>
						</div>
						<div className="bg-slate-950 rounded-xl p-4 flex flex-col mt-4">
							<div className="text-lg font-bold text-center mt-3">Notes</div>
							<AppBox className="flex-1 mt-4">
								<ol className="flex flex-col gap-y-2 pl-6 [&>li]:list-decimal">
									<li>The amount borrowed can be changed later, but not increased beyond the initial amount.</li>
									<li>
										The liquidation price is inherited from the parent position, but can be adjusted later. For example,
										the liquidation price could be doubled and then half of the collateral taken out if the new
										liquidation price is not challenged.
									</li>
									<li>
										It is possible to repay partially or to repay early in order to get the collateral back, but the fee
										is paid upfront and never returned.
									</li>
								</ol>
							</AppBox>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}
