import Head from "next/head";
import AppTitle from "@components/AppTitle";
import AppCard from "@components/AppCard";
import AppButton from "@components/AppButton";
import AddressInput from "@components/Input/AddressInput";
import TokenInput from "@components/Input/TokenInput";
import DateInput from "@components/Input/DateInput";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import PageTabInput from "@components/Input/PageTabInput";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { useState, useEffect } from "react";
import { Address, erc20Abi, isAddress, maxUint256 } from "viem";
import { useConnection, useChainId } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt, signTypedData } from "wagmi/actions";
import { getChain, shortenAddress } from "@utils";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";

const PERMIT_ABI = [
	...erc20Abi,
	{
		type: "function",
		name: "permit",
		inputs: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
			{ name: "value", type: "uint256" },
			{ name: "deadline", type: "uint256" },
			{ name: "v", type: "uint8" },
			{ name: "r", type: "bytes32" },
			{ name: "s", type: "bytes32" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "nonces",
		inputs: [{ name: "owner", type: "address" }],
		outputs: [{ type: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "name",
		inputs: [],
		outputs: [{ type: "string" }],
		stateMutability: "view",
	},
] as const;

function TransferTab() {
	const { address } = useConnection();
	const chainId = useChainId();
	const chain = getChain(chainId as any);
	const [token, setToken] = useState("");
	const [to, setTo] = useState("");
	const [amount, setAmount] = useState("0");
	const [decimals, setDecimals] = useState<number | null>(null);
	const [symbol, setSymbol] = useState<string | null>(null);
	const [balance, setBalance] = useState<bigint | null>(null);
	const [isLoading, setLoading] = useState(false);

	const tokenAddr = isAddress(token) ? (token as Address) : undefined;
	const isDisabled = !tokenAddr || !isAddress(to) || amount === "0" || amount === "";

	useEffect(() => {
		if (!tokenAddr) {
			setDecimals(null);
			setSymbol(null);
			setBalance(null);
			return;
		}
		Promise.all([
			readContract(WAGMI_CONFIG, { address: tokenAddr, abi: erc20Abi, functionName: "decimals", chainId }),
			readContract(WAGMI_CONFIG, { address: tokenAddr, abi: erc20Abi, functionName: "symbol", chainId }),
			address
				? readContract(WAGMI_CONFIG, { address: tokenAddr, abi: erc20Abi, functionName: "balanceOf", args: [address], chainId })
				: Promise.resolve(null),
		])
			.then(([d, s, b]) => {
				setDecimals(d);
				setSymbol(s);
				setBalance(b);
			})
			.catch(() => {
				setDecimals(null);
				setSymbol(null);
				setBalance(null);
			});
	}, [tokenAddr, address, chainId]);

	const handleTransfer = async (e: any) => {
		e.preventDefault();
		if (!tokenAddr || !isAddress(to)) return;
		try {
			setLoading(true);
			const hash = await writeContract(WAGMI_CONFIG, {
				address: tokenAddr,
				abi: erc20Abi,
				functionName: "transfer",
				args: [to as Address, BigInt(amount)],
				chainId,
			});
			const toastContent = [
				{ title: "Recipient:", value: shortenAddress(to) },
				{ title: "Transaction:", hash },
			];
			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash, confirmations: 1 }), {
				pending: { render: <TxToast title="Transfer pending..." rows={toastContent} /> },
				success: { render: <TxToast title="Transfer successful" rows={toastContent} /> },
			});
			setAmount("0");
			setTo("");
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setLoading(false);
		}
	};

	return (
		<AppCard>
			<AddressInput label="Token Address" placeholder="0x..." value={token} onChange={setToken} isTextLeft />
			<AddressInput label="Recipient" placeholder="0x..." value={to} onChange={setTo} isTextLeft />
			<TokenInput
				label={`Amount (${decimals ?? 0} digits)`}
				symbol={symbol ?? ""}
				digit={decimals ?? 0}
				value={amount}
				onChange={setAmount}
				limit={balance ?? 0n}
				limitDigit={decimals ?? 0}
				limitLabel={balance !== null ? "Balance" : undefined}
				max={balance ?? undefined}
				onMax={() => setAmount((balance ?? 0n).toString())}
			/>
			<GuardSupportedChain>
				<AppButton disabled={isDisabled} isLoading={isLoading} onClick={handleTransfer}>
					Transfer on {chain.name}
				</AppButton>
			</GuardSupportedChain>
		</AppCard>
	);
}

function ApproveTab() {
	const { address } = useConnection();
	const chainId = useChainId();
	const chain = getChain(chainId as any);
	const [token, setToken] = useState("");
	const [spender, setSpender] = useState("");
	const [amount, setAmount] = useState("0");
	const [decimals, setDecimals] = useState<number | null>(null);
	const [symbol, setSymbol] = useState<string | null>(null);
	const [balance, setBalance] = useState<bigint | null>(null);
	const [isLoading, setLoading] = useState(false);

	const tokenAddr = isAddress(token) ? (token as Address) : undefined;
	const isDisabled = !tokenAddr || !isAddress(spender);

	useEffect(() => {
		if (!tokenAddr) {
			setDecimals(null);
			setSymbol(null);
			setBalance(null);
			return;
		}
		Promise.all([
			readContract(WAGMI_CONFIG, { address: tokenAddr, abi: erc20Abi, functionName: "decimals", chainId }),
			readContract(WAGMI_CONFIG, { address: tokenAddr, abi: erc20Abi, functionName: "symbol", chainId }),
			address
				? readContract(WAGMI_CONFIG, { address: tokenAddr, abi: erc20Abi, functionName: "balanceOf", args: [address], chainId })
				: Promise.resolve(null),
		])
			.then(([d, s, b]) => {
				setDecimals(d);
				setSymbol(s);
				setBalance(b);
			})
			.catch(() => {
				setDecimals(null);
				setSymbol(null);
				setBalance(null);
			});
	}, [tokenAddr, address, chainId]);

	const handleApprove = async (e: any, infinite = false) => {
		e.preventDefault();
		if (!tokenAddr || !isAddress(spender)) return;
		try {
			setLoading(true);
			const value = infinite ? maxUint256 : BigInt(amount);
			const hash = await writeContract(WAGMI_CONFIG, {
				address: tokenAddr,
				abi: erc20Abi,
				functionName: "approve",
				args: [spender as Address, value],
				chainId,
			});
			const toastContent = [
				{ title: "Spender:", value: shortenAddress(spender) },
				{ title: "Amount:", value: infinite ? "infinite" : amount },
				{ title: "Transaction:", hash },
			];
			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash, confirmations: 1 }), {
				pending: { render: <TxToast title="Approving..." rows={toastContent} /> },
				success: { render: <TxToast title="Approved" rows={toastContent} /> },
			});
			setAmount("0");
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setLoading(false);
		}
	};

	return (
		<AppCard>
			<AddressInput label="Token Address" placeholder="0x..." value={token} onChange={setToken} isTextLeft />
			<AddressInput label="Spender" placeholder="0x..." value={spender} onChange={setSpender} isTextLeft />
			<TokenInput
				label={`Amount (${decimals ?? 0} digits)`}
				symbol={symbol ?? ""}
				digit={decimals ?? 0}
				value={amount}
				onChange={setAmount}
				limit={balance ?? 0n}
				limitDigit={decimals ?? 0}
				limitLabel={balance !== null ? "Balance" : undefined}
				max={balance ?? undefined}
				onMax={() => setAmount((balance ?? 0n).toString())}
			/>
			<GuardSupportedChain>
				<div className="grid grid-cols-2 gap-3">
					<AppButton disabled={isDisabled} isLoading={isLoading} onClick={(e) => handleApprove(e, false)}>
						Approve on {chain.name}
					</AppButton>
					<AppButton disabled={isDisabled} isLoading={isLoading} onClick={(e) => handleApprove(e, true)}>
						Approve Infinite
					</AppButton>
				</div>
			</GuardSupportedChain>
		</AppCard>
	);
}

function PermitTab() {
	const { address } = useConnection();
	const chainId = useChainId();
	const chain = getChain(chainId as any);
	const [token, setToken] = useState("");
	const [spender, setSpender] = useState("");
	const [amount, setAmount] = useState("0");
	const [decimals, setDecimals] = useState<number | null>(null);
	const [symbol, setSymbol] = useState<string | null>(null);
	const [balance, setBalance] = useState<bigint | null>(null);
	const [deadline, setDeadline] = useState<Date>(new Date(Date.now() + 86400_000));
	const [isSigning, setSigning] = useState(false);
	const [isSubmitting, setSubmitting] = useState(false);
	const [permitJson, setPermitJson] = useState("");

	const tokenAddr = isAddress(token) ? (token as Address) : undefined;
	const isDisabled = !tokenAddr || !isAddress(spender) || !address;

	useEffect(() => {
		if (!tokenAddr) {
			setDecimals(null);
			setSymbol(null);
			setBalance(null);
			return;
		}
		Promise.all([
			readContract(WAGMI_CONFIG, { address: tokenAddr, abi: erc20Abi, functionName: "decimals", chainId }),
			readContract(WAGMI_CONFIG, { address: tokenAddr, abi: erc20Abi, functionName: "symbol", chainId }),
			address
				? readContract(WAGMI_CONFIG, { address: tokenAddr, abi: erc20Abi, functionName: "balanceOf", args: [address], chainId })
				: Promise.resolve(null),
		])
			.then(([d, s, b]) => {
				setDecimals(d);
				setSymbol(s);
				setBalance(b);
			})
			.catch(() => {
				setDecimals(null);
				setSymbol(null);
				setBalance(null);
			});
	}, [tokenAddr, address, chainId]);

	const handleSign = async (e: any) => {
		e.preventDefault();
		if (!tokenAddr || !isAddress(spender) || !address) return;
		try {
			setSigning(true);
			const [nonce, tokenName] = await Promise.all([
				readContract(WAGMI_CONFIG, {
					address: tokenAddr,
					abi: PERMIT_ABI,
					functionName: "nonces",
					args: [address],
					chainId,
				}),
				readContract(WAGMI_CONFIG, {
					address: tokenAddr,
					abi: PERMIT_ABI,
					functionName: "name",
					chainId,
				}),
			]);

			const deadlineTs = BigInt(Math.floor(deadline.getTime() / 1000));

			const sig = await signTypedData(WAGMI_CONFIG, {
				domain: {
					name: tokenName,
					version: "1",
					chainId,
					verifyingContract: tokenAddr,
				},
				types: {
					Permit: [
						{ name: "owner", type: "address" },
						{ name: "spender", type: "address" },
						{ name: "value", type: "uint256" },
						{ name: "nonce", type: "uint256" },
						{ name: "deadline", type: "uint256" },
					],
				},
				primaryType: "Permit",
				message: {
					owner: address,
					spender: spender as Address,
					value: BigInt(amount),
					nonce,
					deadline: deadlineTs,
				},
			});

			const { v, r, s } = parsePermitSignature(sig);
			setPermitJson(
				JSON.stringify({ owner: address, spender, value: amount, deadline: deadlineTs.toString(), nonce: nonce.toString(), v, r, s }, null, 2)
			);
			toast.success("Permit signed successfully");
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setSigning(false);
		}
	};

	const parsedPermit = (() => {
		try {
			return JSON.parse(permitJson);
		} catch {
			return null;
		}
	})();

	const handleSubmitPermit = async (e: any) => {
		e.preventDefault();
		if (!tokenAddr || !parsedPermit) return;
		try {
			setSubmitting(true);
			const hash = await writeContract(WAGMI_CONFIG, {
				address: tokenAddr,
				abi: PERMIT_ABI,
				functionName: "permit",
				args: [
					parsedPermit.owner as Address,
					parsedPermit.spender as Address,
					BigInt(parsedPermit.value),
					BigInt(parsedPermit.deadline),
					parsedPermit.v,
					parsedPermit.r as `0x${string}`,
					parsedPermit.s as `0x${string}`,
				],
				chainId,
			});
			const toastContent = [{ title: "Transaction:", hash }];
			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash, confirmations: 1 }), {
				pending: { render: <TxToast title="Submitting permit..." rows={toastContent} /> },
				success: { render: <TxToast title="Permit submitted" rows={toastContent} /> },
			});
			setPermitJson("");
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			<AppCard>
				<AddressInput label="Token Address (ERC-2612)" placeholder="0x..." value={token} onChange={setToken} isTextLeft />
				<AddressInput label="Spender" placeholder="0x..." value={spender} onChange={setSpender} isTextLeft />
				<TokenInput
					label={`Value (${decimals ?? 0} digits)`}
					symbol={symbol ?? ""}
					digit={decimals ?? 0}
					value={amount}
					onChange={setAmount}
					limit={balance ?? 0n}
					limitDigit={decimals ?? 0}
					limitLabel={balance !== null ? "Balance" : undefined}
					max={balance ?? undefined}
					onMax={() => setAmount((balance ?? 0n).toString())}
				/>
				<DateInput
					label="Deadline"
					value={deadline}
					min={new Date()}
					onChange={(d) => d && setDeadline(d)}
					note="The permit expires at this date."
				/>
				<GuardSupportedChain>
					<AppButton disabled={isDisabled} isLoading={isSigning} onClick={handleSign}>
						Sign Permit on {chain.name}
					</AppButton>
				</GuardSupportedChain>
			</AppCard>

			<AppCard>
				<div className="text-card-input-label text-sm font-semibold">Signed Permit Payload</div>
				<textarea
					className="w-full border-2 border-card-input-border hover:border-card-input-hover focus:border-card-input-focus rounded-lg px-3 py-2 bg-transparent text-text-primary text-xs font-mono resize-none outline-none"
					rows={8}
					placeholder='{"owner":"0x...","spender":"0x...","value":"...","deadline":"...","nonce":"...","v":27,"r":"0x...","s":"0x..."}'
					value={permitJson}
					onChange={(e) => setPermitJson(e.target.value)}
				/>
				<GuardSupportedChain>
					<AppButton disabled={!parsedPermit || !tokenAddr} isLoading={isSubmitting} onClick={handleSubmitPermit}>
						Submit Permit On-Chain
					</AppButton>
				</GuardSupportedChain>
			</AppCard>
		</>
	);
}

function parsePermitSignature(sig: `0x${string}`) {
	const r = sig.slice(0, 66) as `0x${string}`;
	const s = ("0x" + sig.slice(66, 130)) as `0x${string}`;
	const v = parseInt(sig.slice(130, 132), 16);
	return { r, s, v };
}

export default function Erc20Page() {
	return (
		<>
			<Head>
				<title>Frankencoin - ERC-20 Tools</title>
			</Head>

			<AppTitle title="ERC-20 Tools">
				<div className="text-text-secondary">
					Transfer tokens, set allowances, or create gasless permit signatures for any ERC-20 token.
				</div>
			</AppTitle>

			<PageTabInput
				tabs={[
					{ label: "Transfer", slug: "transfer", content: <TransferTab /> },
					{ label: "Approve", slug: "approve", content: <ApproveTab /> },
					{ label: "Permit", slug: "permit", content: <PermitTab /> },
				]}
			/>
		</>
	);
}
