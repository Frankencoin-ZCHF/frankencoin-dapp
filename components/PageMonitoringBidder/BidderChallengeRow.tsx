import { useState } from "react";
import { useSelector } from "react-redux";
import { useConnection } from "wagmi";
import { toast } from "react-toastify";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { Address, Hex, encodePacked, formatUnits, isAddress, parseUnits } from "viem";
import { mainnet } from "viem/chains";
import { ChallengesQueryItem } from "@frankencoin/api";
import { WAGMI_CONFIG } from "../../app.config";
import { RootState } from "../../redux/redux.store";
import AppButton from "@components/AppButton";
import AppCard from "@components/AppCard";
import DisplayLabel from "@components/DisplayLabel";
import TokenLogo from "@components/TokenLogo";
import NormalInput from "@components/Input/NormalInput";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { formatCurrency, normalizeAddress } from "@utils";

export const BIDDER_ADDRESS: Address = "0xa81aA67186Ff24077E1ff974940ff9C5755B6Dd6";

const BIDDER_ABI = [
	{
		type: "function",
		name: "execute",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "index", type: "uint32" },
			{ name: "amount", type: "uint256" },
			{ name: "path", type: "bytes" },
		],
		outputs: [],
	},
] as const;

// "0xTokenA 500 0xTokenB 3000 0xZCHF" --> packed uniswap v3 path, raw hex is passed through
function parsePath(input: string): Hex {
	const v = input.trim();
	if (/^0x([0-9a-fA-F]{2})+$/.test(v) && v.length !== 42) return v as Hex;

	const parts = v.split(/[\s,]+/).filter(Boolean);
	if (parts.length < 3 || parts.length % 2 == 0) throw new Error("Path: token fee token [fee token ...]");

	const types: ("address" | "uint24")[] = [];
	for (let i = 0; i < parts.length; i++) {
		if (i % 2 == 0 && !isAddress(parts[i])) throw new Error(`Path: invalid address ${parts[i]}`);
		types.push(i % 2 == 0 ? "address" : "uint24");
	}
	return encodePacked(types, parts.map((p, i) => (i % 2 == 0 ? (p as Address) : (Number(p) as any))) as any);
}

export default function BidderChallengeRow({ challenge }: { challenge: ChallengesQueryItem }) {
	const [amount, setAmount] = useState<string>("");
	const [path, setPath] = useState<string>("");
	const [isAction, setAction] = useState<boolean>(false);

	const account = useConnection();
	const positions = useSelector((state: RootState) => state.positions.mapping);
	const position = positions.map[normalizeAddress(challenge.position)];
	if (!position) return null;

	const decimals = position.collateralDecimals;
	const size = formatUnits(BigInt(challenge.size), decimals);

	const handleExecute = async () => {
		try {
			setAction(true);
			const parsedPath = parsePath(path);
			const parsedAmount = amount.trim() === "" ? 0n : parseUnits(amount, decimals);

			const hash = await writeContract(WAGMI_CONFIG, {
				address: BIDDER_ADDRESS,
				chainId: mainnet.id,
				abi: BIDDER_ABI,
				functionName: "execute",
				args: [Number(challenge.number), parsedAmount, parsedPath],
			});

			const rows = [
				{ title: "Challenge: ", value: `#${challenge.number}` },
				{ title: "Transaction: ", hash },
			];
			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash, confirmations: 1 }), {
				pending: { render: <TxToast title="Executing bidder..." rows={rows} /> },
				success: { render: <TxToast title="Bidder executed" rows={rows} /> },
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAction(false);
		}
	};

	return (
		<AppCard>
			<div className="flex flex-row items-center justify-between">
				<div className="flex flex-row items-center gap-3">
					<TokenLogo currency={position.collateralSymbol} />
					<span className="text-md text-text-primary font-semibold">
						{formatCurrency(size, 2, 2)} {position.collateralSymbol}
					</span>
				</div>
				<span className="text-text-secondary">Challenge #{challenge.number}</span>
			</div>

			<NormalInput
				label="Amount (empty = full size)"
				symbol={position.collateralSymbol}
				digit={decimals}
				value={amount}
				onChange={setAmount}
				actions={[{ label: "Max", onClick: () => setAmount(parseUnits(size, decimals).toString()) }]}
			/>

			<DisplayLabel label="Swap path (collateral, fee, ..., ZCHF)">
				<input
					className="mt-1 w-full rounded-lg border-2 border-card-input-border bg-transparent px-3 py-3 text-text-primary outline-none hover:border-card-input-hover focus:!border-card-input-focus"
					placeholder={`${position.collateral} 500 0xB58E61C3098d85632Df34EecfB899A1Ed80921cB`}
					value={path}
					onChange={(e) => setPath(e.target.value)}
				/>
			</DisplayLabel>

			<GuardSupportedChain chain={mainnet}>
				<AppButton className="h-10" disabled={!account.address || !path.trim()} isLoading={isAction} onClick={handleExecute}>
					Execute
				</AppButton>
			</GuardSupportedChain>
		</AppCard>
	);
}
