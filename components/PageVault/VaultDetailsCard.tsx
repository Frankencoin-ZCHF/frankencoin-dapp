import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import { ContractUrl, formatCurrency, FormatType } from "@utils";
import { Address, formatUnits } from "viem";
import { SupportedChain } from "@frankencoin/zchf";

interface Props {
	chain: SupportedChain;
	vault: Address;
	isUnwrap: boolean;
	amount: bigint;
	preview: bigint;
	svZchfBalance: bigint;
	svZchfValue: bigint;
	exchangeRate: bigint;
}

export default function VaultDetailsCard({ chain, vault, isUnwrap, amount, preview, svZchfBalance, svZchfValue, exchangeRate }: Props) {
	return (
		<AppCard>
			<div className="text-lg font-bold text-center">Outcome</div>
			<div className="p-4 flex flex-col gap-2">
				<div className="flex">
					<div className="flex-1 text-text-secondary">Your svZCHF balance on {chain.name}</div>
					<div className="">{formatCurrency(formatUnits(svZchfBalance, 18))} svZCHF</div>
				</div>

				<div className="flex">
					<div className="flex-1 text-text-secondary">Currently worth</div>
					<div className="">{formatCurrency(formatUnits(svZchfValue, 18))} ZCHF</div>
				</div>

				<div className="flex">
					<div className="flex-1 text-text-secondary">Exchange rate</div>
					<div className="">1 svZCHF = {formatCurrency(formatUnits(exchangeRate, 18), 4, 4, FormatType.us)} ZCHF</div>
				</div>

				<hr className="border-slate-700 border-dashed" />

				<div className="flex">
					<div className="flex-1 text-text-secondary">You send</div>
					<div className="">
						{formatCurrency(formatUnits(amount, 18))} {isUnwrap ? "svZCHF" : "ZCHF"}
					</div>
				</div>

				<div className="flex font-bold">
					<div className="flex-1 text-text-secondary">You receive</div>
					<div className="">
						{formatCurrency(formatUnits(preview, 18))} {isUnwrap ? "ZCHF" : "svZCHF"}
					</div>
				</div>

				<div className="flex mt-6">
					<AppLink className="mx-auto" label="View vault contract" href={ContractUrl(vault, chain)} external={true} />
				</div>
			</div>
		</AppCard>
	);
}
