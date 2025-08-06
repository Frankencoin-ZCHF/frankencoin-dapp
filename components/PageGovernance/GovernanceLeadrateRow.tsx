import { Address, erc20Abi, formatUnits, Hash, maxUint256 } from "viem";
import TableRow from "../Table/TableRow";
import { formatCurrency, shortenAddress } from "../../utils/format";
import { useEffect, useState } from "react";
import { waitForTransactionReceipt, writeContract, readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, ChainSide, EquityABI, LeadrateSenderABI, SavingsABI } from "@frankencoin/zchf";
import { LeadrateProposedOpen } from "@frankencoin/api";
import Button from "@components/Button";
import { toast } from "react-toastify";
import { renderErrorTxToast, renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import AppLink from "@components/AppLink";
import { ContractUrl, TxUrl } from "@utils";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { useAccount } from "wagmi";

const MintModule = ADDRESS[mainnet.id].savingsV2.toLowerCase() as Address;
const SaveModule = ADDRESS[mainnet.id].savingsReferral.toLowerCase() as Address;

interface Props {
	headers: string[];
	tab: string;
	proposal: LeadrateProposedOpen;
}

export default function GovernanceLeadrateRow({ headers, tab, proposal }: Props) {
	const [isDenying, setDenying] = useState<boolean>(false);
	const [isApplying, setApplying] = useState<boolean>(false);
	const [isApproving, setApproving] = useState<boolean>(false);
	const [isSyncing, setSyncing] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(false);

	const [chainSelectors, setChainSelectors] = useState<bigint[]>([]);
	const [targets, setTargets] = useState<Address[]>([]);
	const [ccipFee, setCcipFee] = useState<bigint>(0n);

	const [userLinkBalance, setUserLinkBalance] = useState<bigint>(0n);
	const [userLinkAllowance, setUserLinkAllowance] = useState<bigint>(0n);

	const { address } = useAccount();

	const chainId = mainnet.id;

	const vetoUntil = proposal.nextChange * 1000;
	const hoursUntil: number = (vetoUntil - Date.now()) / 1000 / 60 / 60;
	const stateStr: string = `${hoursUntil < 10 && hoursUntil > 0 ? Math.round(hoursUntil * 10) / 10 : Math.round(hoursUntil)} hours left`;

	const dateArr: string[] = new Date(proposal.details.created * 1000).toDateString().split(" ");
	const dateStr: string = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	useEffect(() => {
		if (address == undefined) return;
		if (proposal.isProposal || proposal.isPending || proposal.isSynced) return;

		const _chainSelectors: bigint[] = [];
		const _targets: Address[] = [];

		for (const chain of Object.values(ChainSide)) {
			_chainSelectors.push(BigInt(ADDRESS[chain.id].chainSelector));
			_targets.push(ADDRESS[chain.id].ccipBridgedSavings);
		}

		setChainSelectors(_chainSelectors);
		setTargets(_targets);

		const overwriteABI = [
			{
				name: "getCCIPFee",
				type: "function",
				stateMutability: "view",
				inputs: [
					{
						name: "chain",
						type: "uint64",
					},
					{
						name: "target",
						type: "address",
					},
					{
						name: "nativeToken",
						type: "bool",
					},
				],
				outputs: [
					{
						name: "",
						type: "uint256",
					},
				],
			},
		] as const;

		const fetcher = async () => {
			const _userLinkBalance = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].linkToken,
				chainId: chainId,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [address],
			});
			setUserLinkBalance(_userLinkBalance);

			const _userLinkAllowance = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].linkToken,
				chainId: chainId,
				abi: erc20Abi,
				functionName: "allowance",
				args: [address, proposal.details.module],
			});
			setUserLinkAllowance(_userLinkAllowance);

			const promises = [];
			for (let i = 0; i < _chainSelectors.length; i++) {
				promises.push(
					readContract(WAGMI_CONFIG, {
						address: ADDRESS[chainId].ccipLeadrateSender,
						chainId: chainId,
						abi: overwriteABI,
						functionName: "getCCIPFee",
						args: [_chainSelectors[i], _targets[i], false],
					})
				);
			}

			const fee = (await Promise.allSettled(promises)).reduce((a, b) => {
				if (b.status == "fulfilled") {
					return a + b.value;
				}
				return a;
			}, 0n);

			setCcipFee(fee);
		};

		fetcher();
	}, [address, chainId, proposal]);

	const handleOnDeny = async function (e: any) {
		e.preventDefault();
		if (address == undefined) return;

		try {
			setDenying(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: proposal.details.module,
				chainId: chainId,
				abi: SavingsABI,
				functionName: "proposeChange",
				args: [proposal.currentRate, []],
			});

			const toastContent = [
				{
					title: `Current: `,
					value: `${formatCurrency(proposal.currentRate / 10000)}%`,
				},
				{
					title: `Denying: `,
					value: `${formatCurrency(proposal.nextRate / 10000)}%`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Denying new rate...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully denied" rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, EquityABI));
		} finally {
			setDenying(false);
		}
	};

	const handleOnApply = async function (e: any) {
		e.preventDefault();
		if (address == undefined) return;

		try {
			setApplying(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: proposal.details.module,
				chainId: chainId,
				abi: SavingsABI,
				functionName: "applyChange",
			});

			const toastContent = [
				{
					title: `From: `,
					value: `${formatCurrency(proposal.currentRate / 10000)}%`,
				},
				{
					title: `Applying to: `,
					value: `${formatCurrency(proposal.nextRate / 10000)}%`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Applying new rate...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully applied" rows={toastContent} />,
				},
			});

			if (proposal.isSynced) {
				setHidden(true);
			}
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApplying(false);
		}
	};

	const handleOnSync = async function (e: any) {
		e.preventDefault();
		if (address == undefined) return;

		try {
			setSyncing(true);

			if (userLinkBalance < ccipFee) {
				toast.warn(
					<TxToast
						title={`Insufficient LINK in wallet`}
						rows={[
							{
								title: `Needed: `,
								value: `${formatCurrency(formatUnits(ccipFee, 18))} LINK`,
							},
						]}
					/>
				);
				return;
			}

			if (userLinkAllowance < ccipFee) {
				setApproving(true);

				const writeHash = await writeContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].linkToken,
					chainId: chainId,
					abi: erc20Abi,
					functionName: "approve",
					args: [proposal.details.module, maxUint256],
				});

				const toastContent = [
					{
						title: "Amount:",
						value: "infinite",
					},
					{
						title: "Spender: ",
						value: shortenAddress(proposal.details.module),
					},
					{
						title: "Transaction:",
						hash: writeHash,
					},
				];

				await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
					pending: {
						render: <TxToast title={`Approving LINK`} rows={toastContent} />,
					},
					success: {
						render: <TxToast title={`Successfully Approved LINK`} rows={toastContent} />,
					},
				});
			}

			const overwriteABI = [
				{
					name: "pushLeadrate",
					type: "function",
					stateMutability: "nonpayable",
					inputs: [
						{
							name: "chains",
							type: "uint64[]",
						},
						{
							name: "targets",
							type: "bytes[]",
						},
					],
					outputs: [],
				},
			] as const;

			// needs to be paid in LINK token
			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].ccipLeadrateSender,
				chainId: chainId,
				abi: overwriteABI,
				functionName: "pushLeadrate",
				args: [chainSelectors, targets],
			});

			const toastContent = [
				{
					title: `From: `,
					value: `${formatCurrency(proposal.currentRate / 10000)}%`,
				},
				{
					title: `Applying to: `,
					value: `${formatCurrency(proposal.nextRate / 10000)}%`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Applying new rate...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully applied" rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
			setSyncing(false);
		}
	};

	return (
		<>
			<TableRow
				headers={headers}
				tab={tab}
				rawHeader={true}
				actionCol={
					proposal.isPending ? (
						<GuardSupportedChain chain={mainnet}>
							<Button className="h-10" disabled={isHidden} isLoading={isDenying} onClick={(e) => handleOnDeny(e)}>
								Deny
							</Button>
						</GuardSupportedChain>
					) : proposal.isProposal && !proposal.isPending ? (
						<GuardSupportedChain chain={mainnet}>
							<Button className="h-10" disabled={isHidden} isLoading={isApplying} onClick={(e) => handleOnApply(e)}>
								Apply
							</Button>
						</GuardSupportedChain>
					) : !proposal.isProposal && !proposal.isPending && !proposal.isSynced ? (
						<GuardSupportedChain chain={mainnet}>
							<Button className="h-10" disabled={isHidden} isLoading={isSyncing} onClick={(e) => handleOnSync(e)}>
								Sync
							</Button>
						</GuardSupportedChain>
					) : (
						<></>
					)
				}
			>
				<div className="flex flex-col md:text-left max-md:text-right">
					<AppLink label={dateStr} href={TxUrl(proposal.details.txHash as Hash)} external={true} className="" />
				</div>

				<div className="flex flex-col">
					<AppLink
						label={shortenAddress(proposal.details.proposer)}
						href={ContractUrl(proposal.details.proposer)}
						external={true}
						className=""
					/>
				</div>

				<div className="flex flex-col">
					<AppLink
						label={proposal.details.module.toLowerCase() == MintModule ? "Mint" : "Save"}
						href={ContractUrl(proposal.details.module)}
						external={true}
						className=""
					/>
				</div>

				<div className={`flex flex-col font-semibold`}>{proposal.nextRate / 10_000} %</div>

				<div className={`flex flex-col`}>{hoursUntil > 0 ? stateStr : "Ready"}</div>
			</TableRow>
		</>
	);
}
