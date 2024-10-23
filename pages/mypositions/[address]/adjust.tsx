import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { formatUnits, maxUint256, erc20Abi, Address } from "viem";
import Head from "next/head";
import TokenInput from "@components/Input/TokenInput";
import DisplayAmount from "@components/DisplayAmount";
import { abs, formatBigInt, formatCurrency, shortenAddress } from "@utils";
import Button from "@components/Button";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast } from "@components/TxToast";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { PositionQuery } from "@frankencoin/api";
import { ADDRESS, PositionV1ABI } from "@frankencoin/zchf";

export default function PositionAdjust() {
	const [isApproving, setApproving] = useState(false);
	const [isAdjusting, setAdjusting] = useState(false);

	const [userCollAllowance, setUserCollAllowance] = useState(0n);
	const [userCollBalance, setUserCollBalance] = useState(0n);
	const [userFrankBalance, setUserFrankBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const account = useAccount();
	const router = useRouter();

	const chainId = useChainId();
	const addressQuery: Address = router.query.address as Address;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == addressQuery) as PositionQuery;

	const [amount, setAmount] = useState<bigint>(BigInt(position.minted || 0n));
	const [collateralAmount, setCollateralAmount] = useState<bigint>(BigInt(position.collateralBalance));
	const [liqPrice, setLiqPrice] = useState<bigint>(BigInt(position?.price ?? 0n));

	// ---------------------------------------------------------------------------
	useEffect(() => {
		const acc: Address | undefined = account.address;
		const fc: Address = ADDRESS[WAGMI_CHAIN.id].frankenCoin;
		if (acc === undefined) return;
		if (!position || !position.collateral) return;

		const fetchAsync = async function () {
			const _balanceFrank = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[WAGMI_CHAIN.id].frankenCoin,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [acc],
			});
			setUserFrankBalance(_balanceFrank);

			const _balanceColl = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [acc],
			});
			setUserCollBalance(_balanceColl);

			const _allowanceColl = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				abi: erc20Abi,
				functionName: "allowance",
				args: [acc, position.position],
			});
			setUserCollAllowance(_allowanceColl);
		};

		fetchAsync();
	}, [data, account.address, position]);

	// ---------------------------------------------------------------------------
	if (!position) return null;

	const expirationInDays: number = (position.expiration * 1000 - Date.now()) / (1000 * 60 * 60 * 24);
	const isCooldown: boolean = position.cooldown * 1000 - Date.now() > 0;

	const maxMintableForCollateralAmount: bigint = BigInt(formatUnits(BigInt(position.price) * collateralAmount, 36 - 18).split(".")[0]);
	const maxMintableInclClones: bigint = BigInt(position.availableForClones) + BigInt(position.minted);
	const maxTotalLimit: bigint =
		maxMintableForCollateralAmount <= maxMintableInclClones ? maxMintableForCollateralAmount : maxMintableInclClones;

	// ---------------------------------------------------------------------------
	const paidOutAmount = () => {
		if (amount > BigInt(position.minted)) {
			return (
				((amount - BigInt(position.minted)) *
					(1_000_000n - BigInt(position.reserveContribution) - BigInt(position.annualInterestPPM))) /
				1_000_000n
			);
		} else {
			return amount - BigInt(position.minted) - returnFromReserve();
		}
	};

	const returnFromReserve = () => {
		return (BigInt(position.reserveContribution) * (amount - BigInt(position.minted))) / 1_000_000n;
	};

	const collateralNote =
		collateralAmount < BigInt(position.collateralBalance)
			? `${formatUnits(abs(collateralAmount - BigInt(position.collateralBalance)), position.collateralDecimals)} ${
					position.collateralSymbol
			  } sent back to your wallet`
			: collateralAmount > BigInt(position.collateralBalance)
			? `${formatUnits(abs(collateralAmount - BigInt(position.collateralBalance)), position.collateralDecimals)} ${
					position.collateralSymbol
			  } taken from your wallet`
			: "";

	const onChangeAmount = (value: string) => {
		setAmount(BigInt(value));
	};

	const onChangeCollAmount = (value: string) => {
		setCollateralAmount(BigInt(value));
	};

	function getCollateralError() {
		if (collateralAmount - BigInt(position.collateralBalance) > userCollBalance) {
			return `Insufficient ${position.collateralSymbol} in your wallet.`;
		} else if (liqPrice * collateralAmount < amount * 10n ** 18n) {
			return "Not enough collateral for the given price and mint amount.";
		}
	}

	function getAmountError() {
		if (isCooldown) {
			return `This position is ${position.cooldown > 1e30 ? "closed" : "in cooldown, please wait"}`;
		} else if (amount - BigInt(position.minted) > maxTotalLimit) {
			return `This position is limited to ${formatCurrency(formatUnits(maxTotalLimit, 18), 2, 2)} ZCHF`;
		} else if (-paidOutAmount() > userFrankBalance) {
			return "Insufficient ZCHF in wallet";
		} else if (liqPrice * collateralAmount < amount * 10n ** 18n) {
			return `Can mint at most ${formatUnits((collateralAmount * liqPrice) / 10n ** 36n, 0)} ZCHF given price and collateral.`;
		} else if (BigInt(position.price) * collateralAmount < amount * 10n ** 18n) {
			return "Amount can only be increased after new price has gone through cooldown.";
		} else {
			return "";
		}
	}

	const onChangeLiqAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setLiqPrice(valueBigInt);
	};

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.collateral as Address,
				abi: erc20Abi,
				functionName: "approve",
				args: [position.position, maxUint256],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: "infinite " + position.collateralSymbol,
				},
				{
					title: "Spender: ",
					value: shortenAddress(position.position),
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

	const handleAdjust = async () => {
		try {
			setAdjusting(true);
			const adjustWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.position,
				abi: PositionV1ABI,
				functionName: "adjust",
				args: [amount, collateralAmount, liqPrice],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount),
				},
				{
					title: "Collateral Amount:",
					value: formatBigInt(collateralAmount, position.collateralDecimals),
				},
				{
					title: "Liquidation Price:",
					value: formatBigInt(liqPrice, 36 - position.collateralDecimals),
				},
				{
					title: "Transaction:",
					hash: adjustWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: adjustWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Adjusting Position`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Adjusted Position" rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setAdjusting(false);
		}
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Manage Position</title>
			</Head>

			<div className="md:mt-8">
				<span className="font-bold text-xl">Manage Position at {shortenAddress(position.position)}</span>
			</div>

			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center">Adjustment</div>
						<TokenInput
							label="Amount"
							symbol="ZCHF"
							output={position.closed ? "0" : ""}
							balanceLabel="Max:"
							max={maxTotalLimit}
							digit={18}
							value={amount.toString()}
							onChange={onChangeAmount}
							error={getAmountError()}
							placeholder="Loan Amount"
						/>
						<TokenInput
							label="Collateral"
							balanceLabel="Max:"
							symbol={position.collateralSymbol}
							max={userCollBalance + BigInt(position.collateralBalance)}
							value={collateralAmount.toString()}
							onChange={onChangeCollAmount}
							digit={position.collateralDecimals}
							note={collateralNote}
							error={getCollateralError()}
							placeholder="Collateral Amount"
						/>
						<TokenInput
							label="Liquidation Price"
							balanceLabel="Current Value"
							symbol={"ZCHF"}
							max={BigInt(position.price)}
							value={liqPrice.toString()}
							digit={36 - position.collateralDecimals}
							onChange={onChangeLiqAmount}
							placeholder="Liquidation Price"
						/>
						<div className="mx-auto mt-8 w-72 max-w-full flex-col">
							<GuardToAllowedChainBtn>
								{collateralAmount - BigInt(position.collateralBalance) > userCollAllowance ? (
									<Button isLoading={isApproving} onClick={() => handleApprove()}>
										Approve Collateral
									</Button>
								) : (
									<Button
										disabled={
											(amount == BigInt(position.minted) &&
												collateralAmount == BigInt(position.collateralBalance) &&
												liqPrice == BigInt(position.price)) ||
											isCooldown ||
											!!getAmountError() ||
											!!getCollateralError()
										}
										error={position.owner != account.address ? "You can only adjust your own position" : ""}
										isLoading={isAdjusting}
										onClick={() => handleAdjust()}
									>
										Adjust Position
									</Button>
								)}
							</GuardToAllowedChainBtn>
						</div>
					</div>
					<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center">Outcome</div>
						<div className="p-4 flex flex-col gap-2">
							<div className="flex">
								<div className="flex-1">Current minted amount</div>
								<DisplayAmount amount={BigInt(position.minted)} currency={"ZCHF"} address={ADDRESS[chainId].frankenCoin} />
							</div>
							<div className="flex">
								<div className="flex-1">{amount >= BigInt(position.minted) ? "You receive" : "You return"}</div>
								<DisplayAmount amount={paidOutAmount()} currency={"ZCHF"} address={ADDRESS[chainId].frankenCoin} />
							</div>
							<div className="flex">
								<div className="flex-1">
									{amount >= BigInt(position.minted) ? "Added to reserve on your behalf" : "Returned from reserve"}
								</div>
								<DisplayAmount amount={returnFromReserve()} currency={"ZCHF"} address={ADDRESS[chainId].frankenCoin} />
							</div>
							<div className="flex">
								<div className="flex-1">Minting fee (interest)</div>
								<DisplayAmount
									amount={
										amount > BigInt(position.minted)
											? ((amount - BigInt(position.minted)) *
													BigInt(position.annualInterestPPM) *
													BigInt(Math.floor(expirationInDays * 1000))) /
											  365000n /
											  1_000_000n
											: 0n
									}
									currency={"ZCHF"}
									address={ADDRESS[chainId].frankenCoin}
								/>
							</div>
							<hr className="border-slate-700 border-dashed" />
							<div className="flex font-bold">
								<div className="flex-1">Future minted amount</div>
								<DisplayAmount amount={amount} currency={"ZCHF"} address={ADDRESS[chainId].frankenCoin} />
							</div>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}
