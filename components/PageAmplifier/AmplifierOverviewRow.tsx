import AppButton from "@components/AppButton";
import AppLink from "@components/AppLink";
import ChainLogo from "@components/ChainLogo";
import DisplayAmount from "@components/DisplayAmount";
import TableRow from "@components/Table/TableRow";
import { useContractUrl } from "@hooks";
import { useAmplifierOverview } from "../../hooks/useAmplifier";
import { formatDateTime, isDateExpired, shortenAddress } from "@utils";
import { KnownAmplifier, amplifierPageLink, getAmplifierChain } from "../../utils/amplifierConstants";

interface Props {
	headers: string[];
	amplifier: KnownAmplifier;
}

export default function AmplifierOverviewRow({ headers, amplifier }: Props) {
	const chain = getAmplifierChain(amplifier.chainId);
	const overview = useAmplifierOverview(amplifier.address, amplifier.chainId);
	const url = useContractUrl(amplifier.address, chain);
	const expired = overview.expiration > 0n && isDateExpired(overview.expiration);
	const pair = overview.invalid ? "Unavailable" : overview.isLoading ? "Loading..." : `${overview.zchfSymbol} / ${overview.usdSymbol || "?"}`;

	return (
		<TableRow
			headers={headers}
			tab={headers[0]}
			actionCol={
				<AppButton className="h-10" to={amplifierPageLink(amplifier)}>
					Open
				</AppButton>
			}
		>
			<div className="flex flex-col text-left">
				<div className="font-semibold">
					{pair}
					{amplifier.isTest ? " (test)" : ""}
				</div>
				<AppLink className="justify-start" label={shortenAddress(amplifier.address)} href={url} external={true} />
			</div>
			<div className="flex items-center justify-end gap-2">
				<ChainLogo chain={chain.name} size={6} />
				<span>{chain.name}</span>
			</div>
			<div className={`flex flex-col ${expired ? "text-text-warning" : ""}`}>
				<span>{overview.expiration > 0n ? formatDateTime(overview.expiration) : "-"}</span>
				{expired && <span className="text-sm">expired</span>}
			</div>
			<div className="flex flex-col">
				<DisplayAmount className="" amount={overview.totalBorrowed} digits={18} unit={overview.zchfSymbol} />
			</div>
			<div className="flex flex-col">
				<DisplayAmount className="" amount={overview.limit} digits={18} unit={overview.zchfSymbol} />
			</div>
		</TableRow>
	);
}
