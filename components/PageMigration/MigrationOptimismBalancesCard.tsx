import { optimism } from "viem/chains";
import { useReadContract } from "wagmi";
import { Address, erc20Abi } from "viem";
import { ADDRESS, ChainIdSide } from "@frankencoin/zchf";
import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import TokenInput from "@components/Input/TokenInput";
import { useUserBalance } from "@hooks";

interface Props {
	viewAddress?: Address;
}

export default function MigrationOptimismBalancesCard({ viewAddress }: Props) {
	const userBalance = useUserBalance(viewAddress);
	const optimismZchfBalance = userBalance[optimism.id as ChainIdSide]?.frankencoin ?? 0n;

	const svZchfToken = ADDRESS[optimism.id].svZCHF;
	const { data: svZchfBalance } = useReadContract({
		chainId: optimism.id,
		address: svZchfToken,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [viewAddress ?? "0x0000000000000000000000000000000000000000"],
	});

	return (
		<AppCard>
			<div className="mt-4 text-lg font-bold text-center">3. Balances on Optimism</div>
			<div className="mt-2 text-text-secondary text-center">Your ZCHF and savings balances on Optimism.</div>

			<div className="mt-6 grid md:grid-cols-2 gap-2">
				<TokenInput
					symbol="ZCHF"
					label="ZCHF on Optimism"
					chain={optimism.name}
					value={optimismZchfBalance.toString()}
					digit={18}
					disabled={true}
				/>

				<TokenInput
					symbol="svZCHF"
					label="svZCHF on Optimism"
					chain={optimism.name}
					value={(svZchfBalance ?? 0n).toString()}
					digit={18}
					disabled={true}
				/>
			</div>

			<div className="flex mt-4">
				<AppLink
					className="mx-auto"
					label="Manage your savings-vault tokens"
					href={viewAddress ? `/savings/vault?address=${viewAddress}` : "/savings/vault"}
				/>
			</div>
		</AppCard>
	);
}
