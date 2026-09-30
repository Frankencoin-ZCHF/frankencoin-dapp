import { shortenAddress } from "../../utils/format";
import AppButton from "@components/AppButton";
import NormalInput from "@components/Input/NormalInput";
import AppCard from "@components/AppCard";
import { useEffect, useState } from "react";
import { useConnection, useReadContract } from "wagmi";
import { WAGMI_CHAIN, WAGMI_CHAINS, WAGMI_CONFIG } from "../../app.config";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ADDRESS, ChainId, ChainIdMain, ChainIdSide, EquityABI, FrankencoinABI, MinterGovernanceABI } from "@frankencoin/zchf";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import TokenInput from "@components/Input/TokenInput";
import AppLink from "@components/AppLink";
import AddressInput from "@components/Input/AddressInput";
import AddressInputChain from "@components/Input/AddressInputChain";
import { Address, erc20Abi, isAddress, parseUnits, zeroAddress } from "viem";
import { useFcsBindingProgress, useUserBalance, QUORUM_RATIO } from "@hooks";
import { SOCIAL } from "@utils";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { AppKitNetwork } from "@reown/appkit/networks";

interface Props {}

// FPS's own veto quorum (2%) is also the point at which FCS is a real enough governance participant
// that proposals should go through MinterGovernance.suggestMinter instead of Frankencoin.suggestMinter
// directly — a proposal submitted directly bypasses MinterGovernance.announcements, leaving it exposed
// to MinterGovernance.denyUnannouncedMinter (permissionless once FCS is active, and rewards the caller).
const FCS_ROUTING_THRESHOLD_PCT = QUORUM_RATIO.fps * 100;

// MinterGovernance.sol: uint256 public constant MIN_APPLICATION_FEE = 1200 ether / MIN_APPLICATION_PERIOD = 60 days.
// Frankencoin.sol's own minimums (MIN_FEE / MIN_APPLICATION_PERIOD) are 1000 ZCHF / 14 days — both are
// Solidity `constant`s, so hardcoding them here (matching how the direct-Frankencoin path already did)
// is safe; no need for a live read.
const MIN_FEE = { direct: 1000, minterGovernance: 1200 };
const MIN_PERIOD_DAYS = { direct: 14, minterGovernance: 60 };

export default function GovernanceMintersPropose({}: Props) {
	const userBal = useUserBalance();
	const [isHandling, setHandling] = useState<boolean>(false);
	const [isApproving, setApproving] = useState<boolean>(false);
	const account = useConnection();
	const [chain, setChain] = useState<AppKitNetwork>(WAGMI_CHAIN as AppKitNetwork);
	const [period, setPeriod] = useState<string>("14");
	const [module, setModule] = useState<string>("");
	const [comment, setComment] = useState<string>("");
	const [isHidden, setHidden] = useState<boolean>(false);
	const [isDisabled, setDisabled] = useState<boolean>(true);
	const [errorAddress, setErrorAddress] = useState<string>("");

	const chainId = chain.id as ChainId;

	const { pct: fcsPct } = useFcsBindingProgress();
	const useMinterGovernance = fcsPct >= FCS_ROUTING_THRESHOLD_PCT;

	const minFee = useMinterGovernance ? MIN_FEE.minterGovernance : MIN_FEE.direct;
	const minPeriodDays = useMinterGovernance ? MIN_PERIOD_DAYS.minterGovernance : MIN_PERIOD_DAYS.direct;

	const zchfAddress =
		chainId == mainnet.id ? ADDRESS[chainId as ChainIdMain].frankencoin : ADDRESS[chainId as ChainIdSide].ccipBridgedFrankencoin;
	const minterGovernanceAddress = (ADDRESS as any)[chainId]?.minterGovernance as Address | undefined;

	// Only the MinterGovernance path pulls the fee via transferFrom — Frankencoin's own suggestMinter
	// moves it internally from msg.sender without needing an allowance (see Frankencoin.sol's _allowance
	// override, which only grants implicit allowance to registered minters/positions/the reserve).
	const { data: allowanceData } = useReadContract({
		address: zchfAddress,
		chainId,
		abi: erc20Abi,
		functionName: "allowance",
		args: [account.address ?? zeroAddress, minterGovernanceAddress ?? zeroAddress],
		query: { enabled: useMinterGovernance && !!minterGovernanceAddress },
	});
	const allowance = allowanceData ?? 0n;
	const feeWei = parseUnits(String(minFee), 18);
	const needsApproval = useMinterGovernance && allowance < feeWei;

	useEffect(() => {
		if (Number(period) < minPeriodDays) setPeriod(String(minPeriodDays));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [useMinterGovernance]);

	useEffect(() => {
		const balance = userBal[chainId]?.frankencoin ?? 0n;
		setDisabled(Number(period) < minPeriodDays || balance < feeWei || !isAddress(module) || comment.length == 0);
	}, [period, module, comment, userBal, chainId, minPeriodDays, feeWei]);

	const changeAddress = (value: string) => {
		setModule(value);
		if (isAddress(value)) setErrorAddress("");
		else setErrorAddress("Not valid address");
	};

	const handleApprove = async function (e: any) {
		e.preventDefault();
		if (!account.address || !minterGovernanceAddress) return;

		try {
			setApproving(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: zchfAddress,
				chainId,
				abi: erc20Abi,
				functionName: "approve",
				args: [minterGovernanceAddress, feeWei],
			});

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: { render: <TxToast title="Approving ZCHF" rows={[{ title: "Transaction: ", hash: writeHash }]} /> },
				success: { render: <TxToast title="Successfully approved ZCHF" rows={[{ title: "Transaction: ", hash: writeHash }]} /> },
			});
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, erc20Abi));
		} finally {
			setApproving(false);
		}
	};

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		try {
			setHandling(true);

			const writeHash =
				useMinterGovernance && minterGovernanceAddress
					? await writeContract(WAGMI_CONFIG, {
							address: minterGovernanceAddress,
							chainId,
							abi: MinterGovernanceABI,
							functionName: "suggestMinter",
							args: [module as Address, BigInt(period) * BigInt(60 * 60 * 24), feeWei, comment],
					  })
					: await writeContract(WAGMI_CONFIG, {
							address: zchfAddress,
							chainId,
							abi: FrankencoinABI,
							functionName: "suggestMinter",
							args: [module as Address, BigInt(period) * BigInt(60 * 60 * 24), feeWei, comment],
					  });

			const toastContent = [
				{
					title: `Module: `,
					value: shortenAddress(module as Address),
				},
				{
					title: `Comment: `,
					value: comment,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Proposing new module...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully proposed" rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, useMinterGovernance ? MinterGovernanceABI : EquityABI));
		} finally {
			setHandling(false);
		}
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
			<AppCard>
				<div className="mt-4 text-lg font-bold text-center">Proposal Process</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
					<TokenInput
						label="Proposal Fee"
						symbol="ZCHF"
						value={String(minFee)}
						onChange={() => {}}
						digit={0}
						error={
							account.address != undefined && userBal[chainId].frankencoin < feeWei ? `Not enough ZCHF on ${chain.name}` : ""
						}
						disabled={true}
						placeholder="Amount"
						chain={chain.name}
					/>
					<NormalInput
						label="Proposal Period"
						symbol="days"
						digit={0}
						value={period}
						onChange={(e) => setPeriod(e)}
						error={Number(period) < minPeriodDays ? `Proposal Period must be at least ${minPeriodDays} days.` : ""}
						placeholder="Number"
					/>
				</div>
				<div className="text-text-secondary">
					It is recommended to{" "}
					<AppLink
						label="discuss"
						href="https://github.com/Frankencoin-ZCHF/FrankenCoin/discussions"
						external={true}
						className=""
					/>{" "}
					the new module and share your thought with the{" "}
					<AppLink label="community" href={SOCIAL.Telegram} external={true} className="" /> before proposing it to increase the
					probability of passing the decentralized governance process.
					{useMinterGovernance && (
						<>
							{" "}
							FCS now holds at least {FCS_ROUTING_THRESHOLD_PCT}% of all FPS votes, so this proposal goes through{" "}
							<span className="text-text-primary font-medium">MinterGovernance</span> instead of Frankencoin directly,
							protecting it from being permissionlessly denied as &quot;unannounced&quot; — at the cost of a higher minimum
							fee and application period.
						</>
					)}
				</div>
			</AppCard>

			<AppCard>
				<div className="flex flex-col gap-4">
					<div className="mt-4 text-lg font-bold text-center">Propose a new Module on {chain.name}</div>

					<AddressInputChain
						label="Address"
						placeholder="Enter the address here"
						value={module}
						onChange={changeAddress}
						error={errorAddress}
						chain={chain.name}
						onChangeChain={(name: string) => {
							const selected = WAGMI_CHAINS.find((c) => c.name === name);
							if (selected) setChain(selected as AppKitNetwork);
						}}
					/>

					<AddressInput label="Comment" placeholder={`Enter the comment here`} value={comment} onChange={setComment} />

					<GuardSupportedChain disabled={isDisabled || isHidden} chain={chain}>
						{needsApproval ? (
							<AppButton
								className="max-md:h-10 md:h-12"
								disabled={isDisabled || isHidden}
								isLoading={isApproving}
								onClick={handleApprove}
							>
								Approve ZCHF
							</AppButton>
						) : (
							<AppButton
								className="max-md:h-10 md:h-12"
								disabled={isDisabled || isHidden}
								isLoading={isHandling}
								onClick={(e) => handleOnClick(e)}
							>
								Propose Module on {chain.name}
							</AppButton>
						)}
					</GuardSupportedChain>
				</div>
			</AppCard>
		</div>
	);
}
