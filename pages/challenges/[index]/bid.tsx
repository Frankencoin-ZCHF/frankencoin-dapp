import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AppBox from "@components/AppBox";
import TokenInput from "@components/Input/TokenInput";
import DisplayAmount from "@components/DisplayAmount";
import { Address, formatUnits, zeroAddress } from "viem";
import { ContractUrl, formatBigInt, formatCurrency, formatDate, shortenAddress } from "@utils";
import Link from "next/link";
import Button from "@components/Button";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast } from "@components/TxToast";
import DisplayLabel from "@components/DisplayLabel";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../../app.config";
import { RootState } from "../../../redux/redux.store";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { useRouter as useNavigation } from "next/navigation";
import { ADDRESS, FrankencoinABI, MintingHubV1ABI, MintingHubV2ABI } from "@frankencoin/zchf";
import { ChallengesId } from "@frankencoin/api";

export default function ChallengePlaceBid() {
	const [isInit, setInit] = useState(false);
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isBidding, setBidding] = useState(false);
	const [isNavigating, setNavigating] = useState(false);
	const [userBalance, setUserBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const account = useAccount();
	const router = useRouter();
	const navigate = useNavigation();

	const chainId = useChainId();
	const challengeId: ChallengesId = (String(router.query.index) as ChallengesId) || `${zeroAddress}-challenge-0`;

	const challenges = useSelector((state: RootState) => state.challenges.list.list);
	const positions = useSelector((state: RootState) => state.positions.list.list);
	const auctionPriceMapping = useSelector((state: RootState) => state.challenges.challengesPrices.map);

	const challenge = challenges.find((c) => c.id == challengeId);
	const position = positions.find((p) => p.position == challenge?.position);
	// const bids = !!challenge ? [] : bidsMapping[challenge!.id]; // can be empty

	useEffect(() => {
		const acc: Address | undefined = account.address;
		const fc: Address = ADDRESS[WAGMI_CHAIN.id].frankenCoin;
		if (acc === undefined) return;

		const fetchAsync = async function () {
			const _balance = await readContract(WAGMI_CONFIG, {
				address: fc,
				abi: FrankencoinABI,
				functionName: "balanceOf",
				args: [acc],
			});
			setUserBalance(_balance);
		};

		fetchAsync();
	}, [data, account.address]);

	useEffect(() => {
		if (isInit) return;
		if (challenge === undefined) return;

		const _amount = BigInt(parseInt(challenge.size.toString()) - parseInt(challenge.filledSize.toString()));
		setAmount(_amount);

		setInit(true);
	}, [isInit, challenge]);

	useEffect(() => {
		if (isNavigating && position?.position) {
			navigate.push(`/mypositions`);
		}
	}, [isNavigating, navigate, position]);

	if (!challenge) return null;
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
			setError("Not enough ZCHF in your wallet to cover the expected costs.");
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
				address: position.version === 1 ? ADDRESS[chainId].mintingHubV1 : ADDRESS[chainId].mintingHubV2,
				abi: position.version === 1 ? MintingHubV1ABI : MintingHubV2ABI,
				functionName: "bid",
				args: [parseInt(challenge.number.toString()), amount, false],
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
			setNavigating(true);
		} finally {
			setBidding(false);
		}
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Bid</title>
			</Head>

			<div className="md:mt-8">
				<section className="mx-auto max-w-2xl sm:px-8">
					<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center mt-3">Buy {position.collateralSymbol} in Auction</div>

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
								balanceLabel="Available:"
							/>
							<div className="flex flex-col">
								<span>Your balance: {formatCurrency(formatUnits(userBalance, 18), 2, 2)} ZCHF</span>
							</div>
							<div className="flex flex-col">
								<span>Estimated price: {formatCurrency(formatUnits(expectedZCHF(), 18), 2, 2)} ZCHF</span>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:col-span-2">
							<AppBox>
								<DisplayLabel label="Available" />
								<DisplayAmount
									amount={remainingSize}
									currency={position.collateralSymbol}
									address={position.collateral}
									digits={position.collateralDecimals}
									className="mt-4"
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Price per Unit" />
								<DisplayAmount
									amount={auctionPrice}
									digits={36 - position.collateralDecimals}
									address={ADDRESS[chainId].frankenCoin}
									currency={"ZCHF"}
									className="mt-4"
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Initially Available" />
								<DisplayAmount
									amount={challenge.size || 0n}
									currency={position.collateralSymbol}
									address={position.collateral}
									digits={position.collateralDecimals}
									className="mt-4"
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
									<div className="mt-4">
										{shortenAddress(challenge?.challenger || zeroAddress)}
										<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
									</div>
								</Link>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Fixed price until" />
								<div>{formatDate(declineStartTimestamp / 1000) || "---"}</div>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Reaching zero at" />
								{formatDate(maturity / 1000) || "---"}
							</AppBox>
						</div>
						<div className="mx-auto mt-4 w-72 max-w-full flex-col">
							<GuardToAllowedChainBtn>
								<Button
									disabled={amount == 0n || expectedZCHF() > userBalance || error != ""}
									isLoading={isBidding}
									onClick={() => handleBid()}
								>
									Buy
								</Button>
							</GuardToAllowedChainBtn>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}
