import Head from "next/head";
import { useRouter } from "next/router";
import AppBox from "@components/AppBox";
import AppPageHeader from "@components/AppPageHeader";
import Button from "@components/Button";
import DisplayAmount from "@components/DisplayAmount";
import TokenInput from "@components/Input/TokenInput";
import { erc20Abi, getAddress, zeroAddress } from "viem";
import { useEffect, useState } from "react";
import { formatBigInt, formatDuration, shortenAddress } from "@utils";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { Address } from "viem";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ABIS, ADDRESS } from "@contracts";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast } from "@components/TxToast";
import DisplayLabel from "@components/DisplayLabel";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";

export default function PositionChallenge() {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [errorDate, setErrorDate] = useState("");
	const [isApproving, setApproving] = useState(false);
	const [isChallenging, setChallenging] = useState(false);
	const [expirationDate, setExpirationDate] = useState(new Date());

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
		const acc: Address | undefined = account.address;
		const fc: Address = ADDRESS[WAGMI_CHAIN.id].frankenCoin;
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
				args: [acc, ADDRESS[WAGMI_CHAIN.id].mintingHub],
			});
			setUserAllowance(_allowanceColl);
		};

		fetchAsync();
	}, [data, account.address, position]);

	// ---------------------------------------------------------------------------
	if (!position) return null;

	const zchfPrice: number = prices[position.zchf.toLowerCase() as Address].price.usd || 1;
	const collateralPriceUSD: number = prices[position.collateral.toLowerCase() as Address].price.usd || 1;
	const collateralPriceCHF: number = collateralPriceUSD / zchfPrice;

	const _collBal: bigint = BigInt(position.collateralBalance);
	const maxChallengeLimit: bigint = _collBal <= userBalance ? _collBal : userBalance;

	const maxProceeds = (parseInt(position.price) / collateralPriceCHF / 10 ** (36 - position.collateralDecimals)) * 100 - 100;

	// ---------------------------------------------------------------------------
	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (valueBigInt > userBalance) {
			setError(`Not enough ${position.collateralSymbol} in your wallet.`);
		} else if (valueBigInt > BigInt(position.collateralBalance)) {
			setError("Challenge collateral should be lower than position collateral");
		} else if (valueBigInt < BigInt(position.minimumCollateral)) {
			if (BigInt(position.collateralBalance) > BigInt(position.minimumCollateral)) {
				setError("Challenge collateral should be greater than minimum collateral");
			}
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
				args: [ADDRESS[chainId].mintingHub, amount],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount, position.collateralDecimals) + " " + position.collateralSymbol,
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

	const handleChallenge = async () => {
		try {
			setChallenging(true);

			const challengeWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].mintingHub,
				abi: ABIS.MintingHubABI,
				functionName: "challenge",
				args: [position.position, amount, BigInt(position.price)],
			});

			const toastContent = [
				{
					title: "Size:",
					value: formatBigInt(amount, position.collateralDecimals) + " " + position.collateralSymbol,
				},
				{
					title: "Price: ",
					value: formatBigInt(BigInt(position.price), 36 - position.collateralDecimals),
				},
				{
					title: "Transaction:",
					hash: challengeWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: challengeWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Launching a challenge`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully Launched challenge`} rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setChallenging(false);
		}
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Position Challenge</title>
			</Head>

			<div>
				<AppPageHeader title="Lunch A Challenge" />
			</div>

			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center mt-3">Launch A Challenge</div>
						<TokenInput
							symbol={position.collateralSymbol}
							max={maxChallengeLimit}
							balanceLabel="Max Size"
							digit={position.collateralDecimals}
							value={amount.toString()}
							onChange={onChangeAmount}
							error={error}
							label="Amount"
							placeholder="Collateral Amount"
						/>
						<div className="grid grid-cols-6 gap-2 lg:col-span-2">
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label="Starting Price" />
								<DisplayAmount
									amount={BigInt(position.price)}
									currency={"ZCHF"}
									digits={36 - position.collateralDecimals}
									address={ADDRESS[chainId].frankenCoin}
									subAmount={maxProceeds}
									subCurrency={"% (Coingecko)"}
									subColor={maxProceeds > 0 ? "text-green-300" : "text-red-500"}
									className="mt-2"
								/>
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label="Maximum Proceeds" />
								<DisplayAmount
									amount={BigInt(position.price) * amount}
									currency={"ZCHF"}
									digits={36}
									address={ADDRESS[chainId].frankenCoin}
									className="mt-2"
								/>
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label="Collateral in Position" />
								<DisplayAmount
									amount={BigInt(position.collateralBalance)}
									currency={position.collateralSymbol}
									digits={position.collateralDecimals}
									address={position.collateral}
									className="mt-2"
								/>
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label="Minimum Amount" />
								<DisplayAmount
									amount={BigInt(position.minimumCollateral)}
									currency={position.collateralSymbol}
									digits={position.collateralDecimals}
									address={position.collateral}
									className="mt-2"
								/>
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label="Fixed Price Phase" />
								{formatDuration(position.challengePeriod)}
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label="Declining Price Phase" />
								{formatDuration(position.challengePeriod)}
							</AppBox>
						</div>
						<div>
							<GuardToAllowedChainBtn>
								{amount > userAllowance ? (
									<Button isLoading={isApproving} disabled={!!error} onClick={() => handleApprove()}>
										Approve
									</Button>
								) : (
									<Button
										variant="primary"
										isLoading={isChallenging}
										disabled={!!error || amount == 0n}
										onClick={() => handleChallenge()}
									>
										Challenge
									</Button>
								)}
							</GuardToAllowedChainBtn>
						</div>
					</div>
					<div className="bg-slate-950 rounded-xl p-4 flex flex-col">
						<div className="text-lg font-bold text-center mt-3">How does it work?</div>
						<AppBox className="flex-1 mt-4">
							<p>
								The amount of the collateral asset you provide will be publicly auctioned in a Dutch auction. The auction
								has two phases, a fixed price phase and a declining price phase.
							</p>
							<ol className="flex flex-col gap-y-2 pl-6 [&>li]:list-decimal">
								<li>
									During the fixed price phase, anyone can buy the {position.collateralSymbol} you provided at the
									liquidation price. If everything gets sold before the phase ends, the challenge is averted and you have
									effectively sold the provided {position.collateralSymbol} to the bidders for{" "}
									{formatBigInt(BigInt(position.price), 36 - position.collateralDecimals)} ZCHF per unit.
								</li>
								<li>
									If the challenge is not averted, the fixed price phase is followed by a declining price phase during
									which the price at which the
									{position.collateralSymbol} tokens can be obtained declines linearly towards zero. In this case, the
									challenge is considered successful and you get the provided {position.collateralSymbol} tokens back. The
									tokens sold in this phase do not come from the challenger, but from the position owner. The total amount
									of tokens that can be bought from the position is limited by the amount left in the challenge at the end
									of the fixed price phase. As a reward for starting a successful challenge, you get 2% of the sales
									proceeds.
								</li>
							</ol>
						</AppBox>
					</div>
				</section>
			</div>
		</>
	);
}
