import { useEffect, useState } from "react";
import { formatUnits, maxUint256 } from "viem";
import { mainnet } from "viem/chains";
import { useConnection } from "wagmi";
import { simulateContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { PositionQuery } from "@frankencoin/api";
import { ADDRESS, ERC20ABI, FrankencoinABI, MintingHubV2ABI, PositionRollerV2ABI, PositionV2ABI } from "@frankencoin/zchf";
import AppDialog from "@components/AppDialog";
import AppApproveAction, { ApprovalStep } from "@components/AppApproveAction";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { formatCurrency, FormatType, normalizeAddress, shortenAddress } from "@utils";
import { RollPreview, track } from "@hooks";
import { WAGMI_CONFIG } from "../../app.config";

interface Props {
	source: PositionQuery;
	target: PositionQuery;
	preview?: RollPreview;
	// collateral that the connected wallet allows the roller to move
	allowance: bigint;
	// ZCHF in the connected wallet
	walletBalance: bigint;
	// repayment that makes the source repayable for the roller, zero if none is needed
	prepareAmount: bigint;
	// why rolling is not possible at all, if so
	blocker?: string;
	onClose: () => void;
}

/**
 * Explains what rolling the source into the target does, shows the outcome with the current numbers
 * and leads through the transactions it takes.
 */
export default function PositionRollerDialog({
	source,
	target,
	preview,
	allowance,
	walletBalance,
	prepareAmount,
	blocker,
	onClose,
}: Props) {
	const [isApproving, setApproving] = useState<boolean>(false);
	const [isPreparing, setPreparing] = useState<boolean>(false);
	const [isRolling, setRolling] = useState<boolean>(false);
	// A confirmed step counts as done right away, the chain state it is derived from follows a moment later
	const [isApproved, setApproved] = useState<boolean>(false);
	const [isPrepared, setPrepared] = useState<boolean>(false);
	// keeps the preparation visible as done once it is, instead of dropping its button
	const [showPrepare, setShowPrepare] = useState<boolean>(prepareAmount > 0n);
	const { address } = useConnection();

	useEffect(() => {
		if (prepareAmount > 0n) setShowPrepare(true);
	}, [prepareAmount]);

	// rolling into a position of the same owner adds to that position, otherwise the roller clones it for the owner
	const isTargetOwned = normalizeAddress(target.owner) === normalizeAddress(source.owner);
	const label = isTargetOwned ? "Merge" : "Roll";
	const action = isTargetOwned ? "Merging" : "Rolling";
	const targetName = isTargetOwned ? "target" : "new";
	const symbol = source.collateralSymbol;

	const needsApproval = !isApproved && allowance < BigInt(source.collateralBalance);
	const needsPrepare = !isPrepared && prepareAmount > 0n;

	const formatZchf = (value: bigint) => formatCurrency(formatUnits(value, 18), 2, 2, FormatType.us) ?? "-";
	const formatCollateral = (value: bigint) =>
		new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(Number(formatUnits(value, source.collateralDecimals)));
	const formatPrice = (value: bigint) => formatCurrency(formatUnits(value, 36 - source.collateralDecimals), 2, 2, FormatType.us) ?? "-";
	const formatMaturity = (timestamp: number) => {
		const date: string[] = new Date(timestamp * 1000).toDateString().split(" ");
		return `${date[2]} ${date[1]} ${date[3]}`;
	};

	// a clone starts empty, an existing position of the owner keeps what it has
	const targetMinted = isTargetOwned ? preview?.targetMinted : 0n;
	const targetCollateral = isTargetOwned ? preview?.targetCollateral : 0n;

	const comparison: { label: string; now: string; after: string }[] = [
		{
			label: "Loan in this position (ZCHF)",
			now: formatZchf(BigInt(source.minted)),
			after: formatZchf(0n),
		},
		{
			label: `Loan in the ${targetName} position (ZCHF)`,
			now: isTargetOwned && preview ? formatZchf(preview.targetMinted) : "-",
			after: preview && targetMinted !== undefined ? formatZchf(targetMinted + preview.mint) : "-",
		},
		{
			label: `Collateral in the ${targetName} position (${symbol})`,
			now: isTargetOwned && preview ? formatCollateral(preview.targetCollateral) : "-",
			after: preview && targetCollateral !== undefined ? formatCollateral(targetCollateral + preview.deposit) : "-",
		},
		{
			label: "Liquidation price (ZCHF)",
			now: formatPrice(BigInt(source.price)),
			after: formatPrice(preview ? preview.targetPrice : BigInt(target.price)),
		},
		{
			label: "Annual interest",
			now: `${formatCurrency(source.annualInterestPPM / 10_000, 2, 2)}%`,
			after: `${formatCurrency(target.annualInterestPPM / 10_000, 2, 2)}%`,
		},
		{
			label: "Maturity",
			now: formatMaturity(source.expiration),
			after: formatMaturity(target.expiration),
		},
	];

	function getDisabledReason(): string | undefined {
		if (blocker) {
			return blocker;
		} else if (needsPrepare && prepareAmount > walletBalance) {
			return `Preparing requires a tiny amount of ZCHF in your wallet, which is empty.`;
		} else if (preview && preview.fromWallet > walletBalance) {
			return `${action} requires ${formatZchf(preview.fromWallet)} ZCHF from your wallet, which only holds ${formatZchf(
				walletBalance
			)} ZCHF.`;
		}
	}

	const disabledReason = getDisabledReason();

	const handleApprove = async () => {
		try {
			setApproving(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: source.collateral,
				chainId: mainnet.id,
				abi: ERC20ABI,
				functionName: "approve",
				args: [ADDRESS[mainnet.id].rollerV2, maxUint256],
			});

			const toastContent = [
				{
					title: `Roller: `,
					value: shortenAddress(ADDRESS[mainnet.id].rollerV2),
				},
				{
					title: `Collateral: `,
					value: shortenAddress(source.collateral),
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Approving collateral for roller...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully approved collateral" rows={toastContent} />,
				},
			});

			setApproved(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, ERC20ABI));
		} finally {
			setApproving(false);
		}
	};

	const handlePrepare = async () => {
		if (!address) return;

		try {
			setPreparing(true);

			// repay() is relative to the current state, unlike adjust(), so a position that changed in the meantime is no issue
			await simulateContract(WAGMI_CONFIG, {
				address: source.position,
				chainId: mainnet.id,
				abi: PositionV2ABI,
				functionName: "repay",
				args: [prepareAmount],
				account: address,
			});

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: source.position,
				chainId: mainnet.id,
				abi: PositionV2ABI,
				functionName: "repay",
				args: [prepareAmount],
			});

			const toastContent = [
				{
					title: `Position: `,
					value: shortenAddress(source.position),
				},
				{
					title: `Repaying: `,
					value: `${formatUnits(prepareAmount, 18)} ZCHF`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Preparing position for rolling...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully prepared position" rows={toastContent} />,
				},
			});

			setPrepared(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, [...PositionV2ABI, ...FrankencoinABI]));
		} finally {
			setPreparing(false);
		}
	};

	const handleRoll = async () => {
		if (!address) return;

		try {
			setRolling(true);

			// A roll that would revert must not reach the wallet. Here, the reason can be shown, whereas wallets fail in
			// opaque ways and might even return a hash for a transaction they never send.
			await simulateContract(WAGMI_CONFIG, {
				address: ADDRESS[mainnet.id].rollerV2,
				chainId: mainnet.id,
				abi: PositionRollerV2ABI,
				functionName: "rollFully",
				args: [source.position, target.position],
				account: address,
			});

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[mainnet.id].rollerV2,
				chainId: mainnet.id,
				abi: PositionRollerV2ABI,
				functionName: "rollFully",
				args: [source.position, target.position],
			});

			const toastContent = [
				{
					title: `Rolling from: `,
					value: shortenAddress(source.position),
				},
				{
					title: `${action} to: `,
					value: shortenAddress(target.position),
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`${action} position...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully ${isTargetOwned ? "merged" : "rolled"} position`} rows={toastContent} />,
				},
			});

			track(isTargetOwned ? "position_merged" : "position_rolled");
			onClose();
		} catch (error) {
			// the roll runs through the roller, both positions, the Frankencoin contract and, when cloning the target,
			// the minting hub, any of which can reject it
			toast.error(renderErrorTxToastDecode(error, [...PositionV2ABI, ...PositionRollerV2ABI, ...MintingHubV2ABI, ...FrankencoinABI]));
		} finally {
			setRolling(false);
		}
	};

	// transactions that come before the roll, in order
	const steps: ApprovalStep[] = [
		{
			tokenSymbol: symbol,
			needsApproval,
			isApproving,
			onApprove: handleApprove,
			hint: `The roller needs your approval to move the ${symbol} of this position.`,
		},
	];
	if (showPrepare) {
		steps.push({
			tokenSymbol: "",
			label: "Prepare",
			busyLabel: "Preparing...",
			doneLabel: "Prepared",
			needsApproval: needsPrepare,
			isApproving: isPreparing,
			onApprove: handlePrepare,
			hint: `Prepare first to enable ${label}.`,
		});
	}

	return (
		<AppDialog title={`${label} Position`} isOpen={true} onClose={onClose} preventClose={isApproving || isPreparing || isRolling}>
			<div className="text-text-secondary">
				{isTargetOwned
					? `Merging repays this position in full and moves its collateral and loan into your position ${shortenAddress(
							target.position
					  )}. `
					: `Rolling repays this position in full and opens a new position for you with the terms of position ${shortenAddress(
							target.position
					  )}, into which the collateral is moved. `}
				The upfront interest for the new term is added to the loan.
				{preview && preview.fromWallet > 0n
					? ` At the liquidation price of the ${targetName} position, the collateral does not back the entire loan, so the remainder is taken from your wallet.`
					: ""}
			</div>

			<div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 text-sm">
				<div />
				<div className="text-right text-text-secondary">Now</div>
				<div className="text-right text-text-secondary">After</div>
				{comparison.map((row) => (
					<div className="contents" key={row.label}>
						<div className="text-text-secondary">{row.label}</div>
						<div className="text-right">{row.now}</div>
						<div className="text-right font-semibold">{row.after}</div>
					</div>
				))}
			</div>

			<div className="flex flex-col gap-y-2 text-sm">
				<hr className="border-text-primary border-dashed" />
				<div className="flex">
					<div className="flex-1 text-text-secondary">Upfront interest until maturity</div>
					<div className="text-right">{preview ? formatZchf(preview.interest) : "-"} ZCHF</div>
				</div>
				{preview && preview.collateralReturned > 0n && (
					<div className="flex">
						<div className="flex-1 text-text-secondary">Collateral returned to your wallet</div>
						<div className="text-right">
							{formatCollateral(preview.collateralReturned)} {symbol}
						</div>
					</div>
				)}
				<div className="flex font-semibold">
					<div className="flex-1 text-text-secondary">Taken from your wallet</div>
					<div className="text-right">{preview ? formatZchf(preview.fromWallet) : "-"} ZCHF</div>
				</div>
			</div>

			{needsPrepare && (
				<div className="text-sm text-text-secondary">
					{`"Prepare" repays a little bit of the loan to ensure the rolling does not fail due to rounding errors.`}
				</div>
			)}

			<GuardSupportedChain chain={mainnet}>
				<div>
					<AppApproveAction
						actionLabel={label}
						approvals={steps}
						isActing={isRolling}
						disabled={!!disabledReason}
						// what is being confirmed must be on display first
						actionDisabled={!preview}
						onAction={handleRoll}
						// the reason takes the place of the hint
						hint={
							disabledReason
								? ""
								: !preview && !needsApproval && !needsPrepare
								? "Waiting for the current state of the target position."
								: undefined
						}
					/>
					{disabledReason && <div className="text-center text-sm text-text-warning">{disabledReason}</div>}
				</div>
			</GuardSupportedChain>
		</AppDialog>
	);
}
