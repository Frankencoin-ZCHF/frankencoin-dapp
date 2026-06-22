import Head from "next/head";
import AppTitle from "@components/AppTitle";
import AppCard from "@components/AppCard";
import AppButton from "@components/AppButton";
import AddressInput from "@components/Input/AddressInput";
import NormalInput from "@components/Input/NormalInput";
import DateInput from "@components/Input/DateInput";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { useState } from "react";
import { Address, isAddress, toHex } from "viem";
import { useConnection, useChainId } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt, signTypedData } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";

const ERC3009_ABI = [
	{
		type: "function",
		name: "transferWithAuthorization",
		inputs: [
			{ name: "from", type: "address" },
			{ name: "to", type: "address" },
			{ name: "value", type: "uint256" },
			{ name: "validAfter", type: "uint256" },
			{ name: "validBefore", type: "uint256" },
			{ name: "nonce", type: "bytes32" },
			{ name: "v", type: "uint8" },
			{ name: "r", type: "bytes32" },
			{ name: "s", type: "bytes32" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "name",
		inputs: [],
		outputs: [{ type: "string" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "version",
		inputs: [],
		outputs: [{ type: "string" }],
		stateMutability: "view",
	},
] as const;

type AuthPayload = {
	token: string;
	from: string;
	to: string;
	value: string;
	validAfter: string;
	validBefore: string;
	nonce: string;
	v: number;
	r: string;
	s: string;
	chainId: number;
};

function randomNonce(): `0x${string}` {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return toHex(bytes);
}

function splitSignature(sig: `0x${string}`) {
	const r = sig.slice(0, 66) as `0x${string}`;
	const s = ("0x" + sig.slice(66, 130)) as `0x${string}`;
	const v = parseInt(sig.slice(130, 132), 16);
	return { r, s, v };
}

function CreateSection({ onCreated }: { onCreated: (payload: AuthPayload) => void }) {
	const { address } = useConnection();
	const chainId = useChainId();
	const [token, setToken] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [value, setValue] = useState("0");
	const [validAfter, setValidAfter] = useState<Date>(new Date(0));
	const [validBefore, setValidBefore] = useState<Date>(new Date(Date.now() + 86400_000));
	const [nonce, setNonce] = useState<string>(randomNonce());
	const [isSigning, setSigning] = useState(false);

	const tokenAddr = isAddress(token) ? (token as Address) : undefined;
	const fromAddr = isAddress(from) ? (from as Address) : undefined;
	const toAddr = isAddress(to) ? (to as Address) : undefined;
	const isDisabled = !tokenAddr || !fromAddr || !toAddr || value === "0" || value === "";

	const handleSign = async (e: any) => {
		e.preventDefault();
		if (!tokenAddr || !fromAddr || !toAddr) return;
		try {
			setSigning(true);

			let tokenName = "Token";
			let tokenVersion = "1";
			try {
				tokenName = await readContract(WAGMI_CONFIG, {
					address: tokenAddr,
					abi: ERC3009_ABI,
					functionName: "name",
					chainId,
				});
			} catch {}
			try {
				tokenVersion = await readContract(WAGMI_CONFIG, {
					address: tokenAddr,
					abi: ERC3009_ABI,
					functionName: "version",
					chainId,
				});
			} catch {}

			const validAfterTs = BigInt(Math.floor(validAfter.getTime() / 1000));
			const validBeforeTs = BigInt(Math.floor(validBefore.getTime() / 1000));
			const nonceHex = (nonce.startsWith("0x") ? nonce : "0x" + nonce) as `0x${string}`;

			const sig = await signTypedData(WAGMI_CONFIG, {
				domain: {
					name: tokenName,
					version: tokenVersion,
					chainId,
					verifyingContract: tokenAddr,
				},
				types: {
					TransferWithAuthorization: [
						{ name: "from", type: "address" },
						{ name: "to", type: "address" },
						{ name: "value", type: "uint256" },
						{ name: "validAfter", type: "uint256" },
						{ name: "validBefore", type: "uint256" },
						{ name: "nonce", type: "bytes32" },
					],
				},
				primaryType: "TransferWithAuthorization",
				message: {
					from: fromAddr,
					to: toAddr,
					value: BigInt(value),
					validAfter: validAfterTs,
					validBefore: validBeforeTs,
					nonce: nonceHex,
				},
			});

			const { v, r, s } = splitSignature(sig);
			const payload: AuthPayload = {
				token,
				from,
				to,
				value,
				validAfter: validAfterTs.toString(),
				validBefore: validBeforeTs.toString(),
				nonce: nonceHex,
				v,
				r,
				s,
				chainId,
			};
			onCreated(payload);
			toast.success("Authorization signed successfully");
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setSigning(false);
		}
	};

	return (
		<AppCard>
			<div className="text-text-secondary text-sm">
				Sign a transfer authorization (ERC-3009). The signed payload can be handed to any relayer or counterparty who will
				submit it on-chain.
			</div>

			<AddressInput label="Token Address (ERC-3009)" placeholder="0x..." value={token} onChange={setToken} isTextLeft />
			<AddressInput label="From" placeholder="0x..." value={from} onChange={setFrom} own={address} isTextLeft />
			<AddressInput label="To" placeholder="0x..." value={to} onChange={setTo} isTextLeft />
			<NormalInput label="Value (raw units)" symbol="wei" digit={0} value={value} onChange={setValue} />

			<DateInput
				label="Valid After"
				value={validAfter}
				onChange={(d) => d && setValidAfter(d)}
				note="Authorization is invalid before this time. Use epoch 0 for immediate validity."
			/>
			<DateInput
				label="Valid Before"
				value={validBefore}
				min={new Date()}
				onChange={(d) => d && setValidBefore(d)}
				note="Authorization expires after this time."
			/>

			<div>
				<div
					className="group border-card-input-border hover:border-card-input-hover focus-within:!border-card-input-focus text-text-secondary border-2 rounded-lg px-3 py-1 cursor-text"
					onClick={() => {}}
				>
					<div className="flex text-card-input-label my-1 justify-between items-center">
						<span>Nonce (bytes32)</span>
						<span
							className="text-card-input-max cursor-pointer hover:text-card-input-focus font-extrabold text-xs"
							onClick={() => setNonce(randomNonce())}
						>
							Randomize
						</span>
					</div>
					<input
						className="w-full py-2 text-sm text-right bg-transparent text-text-primary font-mono"
						value={nonce}
						onChange={(e) => setNonce(e.target.value)}
						placeholder="0x..."
					/>
				</div>
			</div>

			<GuardSupportedChain>
				<AppButton disabled={isDisabled} isLoading={isSigning} onClick={handleSign}>
					Sign Authorization
				</AppButton>
			</GuardSupportedChain>
		</AppCard>
	);
}

function ExecuteSection({ prefill }: { prefill: AuthPayload | null }) {
	const chainId = useChainId();
	const [jsonInput, setJsonInput] = useState("");
	const [isLoading, setLoading] = useState(false);

	const parsed: AuthPayload | null = (() => {
		if (prefill) return prefill;
		try {
			return JSON.parse(jsonInput) as AuthPayload;
		} catch {
			return null;
		}
	})();

	const isValid =
		parsed &&
		isAddress(parsed.token) &&
		isAddress(parsed.from) &&
		isAddress(parsed.to) &&
		parsed.v != null &&
		parsed.r?.startsWith("0x") &&
		parsed.s?.startsWith("0x");

	const handleExecute = async (e: any) => {
		e.preventDefault();
		if (!parsed || !isValid) return;
		try {
			setLoading(true);
			const hash = await writeContract(WAGMI_CONFIG, {
				address: parsed.token as Address,
				abi: ERC3009_ABI,
				functionName: "transferWithAuthorization",
				args: [
					parsed.from as Address,
					parsed.to as Address,
					BigInt(parsed.value),
					BigInt(parsed.validAfter),
					BigInt(parsed.validBefore),
					parsed.nonce as `0x${string}`,
					parsed.v,
					parsed.r as `0x${string}`,
					parsed.s as `0x${string}`,
				],
				chainId: parsed.chainId ?? chainId,
			});
			const toastContent = [{ title: "Transaction:", hash }];
			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash, confirmations: 1 }), {
				pending: { render: <TxToast title="Executing authorization..." rows={toastContent} /> },
				success: { render: <TxToast title="Authorization executed" rows={toastContent} /> },
			});
			setJsonInput("");
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setLoading(false);
		}
	};

	return (
		<AppCard>
			<div className="text-text-secondary text-sm">
				Submit a signed transfer authorization on-chain. Paste the JSON payload from the Create section, or provide one from a
				counterparty.
			</div>

			{!prefill && (
				<div>
					<div className="text-card-input-label text-sm mb-1">Authorization Payload (JSON)</div>
					<textarea
						className="w-full border-2 border-card-input-border hover:border-card-input-hover focus:border-card-input-focus rounded-lg px-3 py-2 bg-transparent text-text-primary text-xs font-mono resize-none outline-none"
						rows={10}
						placeholder='{"token":"0x...","from":"0x...","to":"0x...","value":"1000000000000000000","validAfter":"0","validBefore":"9999999999","nonce":"0x...","v":27,"r":"0x...","s":"0x..."}'
						value={jsonInput}
						onChange={(e) => setJsonInput(e.target.value)}
					/>
				</div>
			)}

			{parsed && (
				<div className="rounded-lg bg-card-content-primary p-4">
					<div className="text-card-input-label text-sm mb-2 font-semibold">Parsed Authorization</div>
					<pre className="text-xs text-text-primary whitespace-pre-wrap break-all overflow-x-auto">
						{JSON.stringify(parsed, null, 2)}
					</pre>
				</div>
			)}

			<GuardSupportedChain>
				<AppButton disabled={!isValid} isLoading={isLoading} onClick={handleExecute}>
					Execute Authorization
				</AppButton>
			</GuardSupportedChain>
		</AppCard>
	);
}

export default function AuthorizePage() {
	const [signedPayload, setSignedPayload] = useState<AuthPayload | null>(null);

	return (
		<>
			<Head>
				<title>Frankencoin - Authorization Tools</title>
			</Head>

			<AppTitle title="Authorization Tools">
				<div className="text-text-secondary">
					Create and submit signed transfer authorizations (ERC-3009) for gasless or delegated token transfers.
				</div>
			</AppTitle>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
				<div className="flex flex-col gap-4">
					<div className="font-bold text-lg text-text-primary">1. Create Authorization</div>
					<CreateSection onCreated={setSignedPayload} />
				</div>

				<div className="flex flex-col gap-4">
					<div className="font-bold text-lg text-text-primary">2. Execute Authorization</div>
					<ExecuteSection prefill={signedPayload} />
				</div>
			</div>

			{signedPayload && (
				<div className="mt-4">
					<AppCard>
						<div className="text-card-input-label text-sm font-semibold">Signed Payload (shareable)</div>
						<pre className="text-xs text-text-primary whitespace-pre-wrap break-all overflow-x-auto">
							{JSON.stringify(signedPayload, null, 2)}
						</pre>
						<AppButton
							onClick={() => {
								navigator.clipboard.writeText(JSON.stringify(signedPayload, null, 2));
								toast.success("Copied to clipboard");
							}}
						>
							Copy JSON
						</AppButton>
					</AppCard>
				</div>
			)}
		</>
	);
}
