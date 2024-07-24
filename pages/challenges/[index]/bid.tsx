import { useEffect, useState } from "react";
import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import { useRouter } from "next/router";
import AppBox from "@components/AppBox";
import TokenInput from "@components/Input/TokenInput";
import DisplayAmount from "@components/DisplayAmount";
import { useChallengeListStats, useChallengeLists, usePositionStats, useContractUrl } from "@hooks";
import { Address, erc20Abi, formatUnits, getAddress, zeroAddress } from "viem";
import { ContractUrl, formatBigInt, formatCurrency, formatDate, formatDuration, min, shortenAddress } from "@utils";
import Link from "next/link";
import Button from "@components/Button";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ABIS, ADDRESS } from "@contracts";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast } from "@components/TxToast";
import DisplayLabel from "@components/DisplayLabel";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../../app.config";
import { RootState } from "../../../redux/redux.store";
import { useSelector } from "react-redux";

export default function ChallengePlaceBid() {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isBidding, setBidding] = useState(false);
	const [userBalance, setUserBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const account = useAccount();
	const router = useRouter();

	const chainId = useChainId();
	const index: number = parseInt(String(router.query.index) || "0");

	const challenges = useSelector((state: RootState) => state.challenges.list.list);
	const positions = useSelector((state: RootState) => state.positions.list.list);
	const bidsMapping = useSelector((state: RootState) => state.bids.challenges.map);
	const auctionPriceMapping = useSelector((state: RootState) => state.challenges.challengesPrices.map);

	useEffect(() => {
		const acc: Address | undefined = account.address;
		const fc: Address = ADDRESS[WAGMI_CHAIN.id].frankenCoin;
		if (acc === undefined) return;

		const fetchAsync = async function () {
			const _balance = await readContract(WAGMI_CONFIG, {
				address: fc,
				abi: ABIS.FrankencoinABI,
				functionName: "balanceOf",
				args: [acc],
			});
			setUserBalance(_balance);
		};

		fetchAsync();
	}, [data, account.address]);

	const challenge = challenges.find((c) => c.number.toString() == index.toString());
	if (!challenge) return null;

	const position = positions.find((p) => p.position == challenge?.position);
	const bids = bidsMapping[challenge.id]; // can be empty
	if (!position) return null;

	const auctionPrice = BigInt(auctionPriceMapping[challenge.id] ?? "0");
	const remainingSize = BigInt(parseInt(challenge.size.toString()) - parseInt(challenge.filledSize.toString()));

	// Maturity
	const start: number = parseInt(challenge.start.toString()) * 1000; // timestap
	const since: number = Math.round(((Date.now() - start) / 1000 / 60 / 60) * 10) / 10; // since timestamp to now

	const duration: number = parseInt(challenge.duration.toString()) * 1000;
	const maturity: number = Math.min(...[position.expiration * 1000, start + 2 * duration]); // timestamp
	const time2exp: number = Math.round(((maturity - Date.now()) / 1000 / 60 / 60) * 10) / 10; // time to expiration

	const isQuickAuction = start + 2 * duration > maturity;
	const declineStartTimestamp = isQuickAuction ? start : start + duration;

	const expectedZCHF = (bidAmount?: bigint) => {
		if (!bidAmount) bidAmount = amount;
		return challenge ? (bidAmount * auctionPrice) / BigInt(1e18) : BigInt(0);
	};

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);

		if (expectedZCHF() > userBalance) {
			setError("Not enough balance in your wallet.");
		} else if (valueBigInt > remainingSize) {
			setError("Expected winning collateral should be lower than remaining collateral.");
		} else {
			setError("");
		}
	};

	const handleBid = async () => {
		try {
			setBidding(true);

			const bidWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].mintingHub,
				abi: ABIS.MintingHubABI,
				functionName: "bid",
				args: [index, amount, true],
			});

			const toastContent = [
				{
					title: `Bid Amount: `,
					value: formatBigInt(amount, position.collateralDecimals) + " " + position.collateralSymbol,
				},
				{
					title: `Expected ZCHF: `,
					value: formatBigInt(expectedZCHF()) + " ZCHF",
				},
				{
					title: "Transaction:",
					hash: bidWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: bidWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Placing a bid`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Placed Bid" rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setBidding(false);
		}
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Place Bid</title>
			</Head>
			<div className="md:mt-8">
				<section className="mx-auto max-w-2xl sm:px-8">
					<div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center mt-3">Place your Bid</div>

						<div className="">
							<TokenInput
								label=""
								max={remainingSize}
								value={amount.toString()}
								onChange={onChangeAmount}
								digit={position.collateralDecimals}
								symbol={position.collateralSymbol}
								error={error}
								placeholder="Collateral Amount"
								balanceLabel="Remaining Size"
							/>
							<div className="flex flex-col">
								<span>Your Account balance: {formatCurrency(formatUnits(userBalance, 18), 2, 2)} ZCHF</span>
							</div>
							<div className="flex flex-col">
								<span>Expected Costs: {formatCurrency(formatUnits(expectedZCHF(), 18), 2, 2)} ZCHF</span>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:col-span-2">
							<AppBox>
								<DisplayLabel label="Remaining Collateral" />
								<DisplayAmount
									amount={remainingSize}
									currency={position.collateralSymbol}
									address={position.collateral}
									digits={position.collateralDecimals}
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Price per Unit" />
								<DisplayAmount
									amount={auctionPrice}
									digits={36 - position.collateralDecimals}
									address={ADDRESS[chainId].frankenCoin}
									currency={"ZCHF"}
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Original Size" />
								<DisplayAmount
									amount={challenge.size || 0n}
									currency={position.collateralSymbol}
									address={position.collateral}
									digits={position.collateralDecimals}
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Challenger" />
								<Link
									className="text-link"
									href={ContractUrl(challenge?.challenger || zeroAddress, WAGMI_CHAIN)}
									target="_blank"
									rel="noreferrer"
								>
									{shortenAddress(challenge?.challenger || zeroAddress)}
								</Link>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Starting to decline at" />
								<div>{formatDate(declineStartTimestamp / 1000) || "---"}</div>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Reaching Zero at" />
								{formatDate(maturity / 1000) || "---"}
							</AppBox>
						</div>
						<div className="mx-auto mt-4 w-72 max-w-full flex-col">
							<GuardToAllowedChainBtn>
								<Button
									variant="primary"
									disabled={amount == 0n || expectedZCHF() > userBalance}
									isLoading={isBidding}
									onClick={() => handleBid()}
								>
									Place Bid
								</Button>
							</GuardToAllowedChainBtn>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}
