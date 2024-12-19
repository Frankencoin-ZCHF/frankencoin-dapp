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
				address: ADDR.mintingHubV2,
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

	const expectedZCHF = (bidAmount?: bigint) => {
		if (!bidAmount) bidAmount = amount;
		return (bidAmount * auctionPrice) / BigInt(1e18);
	};

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);

		if (expectedZCHF() > userBalance) {
			setError(`Not enough ${TOKEN_SYMBOL} in your wallet to cover the expected costs.`);
		} else if (valueBigInt > BigInt(position.collateralBalance)) {
			setError("Expected buying collateral should be lower than remaining collateral.");
		} else {
			setError("");
		}
	};

	const handleBid = async () => {
		try {
			setBidding(true);

			const bidWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].mintingHubV2,
				abi: MintingHubV2ABI,
				functionName: "buyExpiredCollateral",
				args: [position.position, amount],
			});

			const toastContent = [
				{
					title: `ForceSell Amount: `,
					value: formatBigInt(amount, position.collateralDecimals) + " " + position.collateralSymbol,
				},
				{
					title: `Expected ${TOKEN_SYMBOL}: `,
					value: formatCurrency(formatUnits(expectedZCHF(), 18)) + " " + TOKEN_SYMBOL,
				},
				{
					title: "Transaction:",
					hash: bidWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: bidWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Force to Sell ${position.collateralSymbol}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Forced to Sell" rows={toastContent} />,
				},
			});
			setNavigating(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setBidding(false);
		}
	};

	return (
		<>
			<Head>
				<title>dEURO - Force Sell</title>
			</Head>

			<div className="md:mt-8">
				<section className="mx-auto max-w-2xl sm:px-8">
					<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center mt-3">Force to Sell and Buy {position.collateralSymbol}</div>

						<div className="">
							<TokenInput
								label=""
								max={BigInt(position.collateralBalance)}
								value={amount.toString()}
								onChange={onChangeAmount}
								digit={position.collateralDecimals}
								symbol={position.collateralSymbol}
								error={error}
								placeholder="Collateral Amount"
								balanceLabel="Available:"
							/>
							<div className="flex flex-col">
								<span>Your balance: {formatCurrency(formatUnits(userBalance, 18), 2, 2)} {TOKEN_SYMBOL}</span>
							</div>
							<div className="flex flex-col">
								<span>Estimated cost: {formatCurrency(formatUnits(expectedZCHF(), 18), 2, 2)} {TOKEN_SYMBOL}</span>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:col-span-2">
							<AppBox>
								<DisplayLabel label="Available" />
								<DisplayAmount
									amount={BigInt(position.collateralBalance)}
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
									address={ADDRESS[chainId].decentralizedEURO}
									currency={TOKEN_SYMBOL}
									className="mt-4"
								/>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Owner" />
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
								<DisplayLabel label="Position" />
								<Link className="text-link" href={`/monitoring/${position.position}`}>
									<div className="">{shortenAddress(position.position)}</div>
								</Link>
							</AppBox>
							<AppBox>
								<DisplayLabel label="From 10x price decline until" />
								<div>{formatDate(declineOnePriceTimestamp / 1000) || "---"}</div>
							</AppBox>
							<AppBox>
								<DisplayLabel label="Reaching zero at" />
								{formatDate(zeroPriceTimestamp / 1000) || "---"}
							</AppBox>
						</div>
						<div className="mx-auto mt-4 w-72 max-w-full flex-col">
							{/* Override lable here */}
							<GuardToAllowedChainBtn label="Force Sell">
								<Button
									disabled={amount == 0n || expectedZCHF() > userBalance || error != ""}
									isLoading={isBidding}
									onClick={() => handleBid()}
								>
									Force Sell
								</Button>
							</GuardToAllowedChainBtn>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}
