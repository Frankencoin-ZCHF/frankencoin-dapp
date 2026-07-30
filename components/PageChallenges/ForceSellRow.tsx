import { formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery } from "@frankencoin/api";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency, normalizeAddress } from "../../utils/format";
import { getForceSellAuctionEnd, getForceSellPrice } from "../../utils/forceSell";
import { useRouter as useNavigation } from "next/navigation";
import AppButton from "@components/AppButton";
import { useContractUrl } from "@hooks";
import AppBox from "@components/AppBox";

interface Props {
	headers: string[];
	tab: string;
	position: PositionQuery;
}

export default function ForceSellRow({ headers, tab, position }: Props) {
	const navigate = useNavigation();
	const url = useContractUrl(position.collateral || zeroAddress);

	const priceDigits = 36 - position.collateralDecimals;
	const auctionEndMs = getForceSellAuctionEnd(position) * 1000;

	const currentPrice = getForceSellPrice(position);
	const currentPriceFormatted = formatUnits(currentPrice, priceDigits);

	const balance = parseFloat(formatUnits(BigInt(position.collateralBalance), position.collateralDecimals));

	const states: string[] = ["Declining Price", "Zero Price"];
	let stateIdx: number = 0;
	let stateTimeLeft: string = "";

	if (Date.now() >= auctionEndMs) {
		stateIdx = 1;
		stateTimeLeft = "-";
	} else {
		stateIdx = 0;
		const diff: number = auctionEndMs - Date.now();
		const d: number = Math.floor(diff / 1000 / 60 / 60 / 24);
		const h: number = Math.floor((diff / 1000 / 60 / 60 / 24 - d) * 24);
		const m: number = Math.floor(diff / 1000 / 60 - d * 24 * 60 - h * 60);
		stateTimeLeft = `${d}d ${h}h ${m}m`;
	}

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<TableRow
			headers={headers}
			tab={tab}
			actionCol={
				<AppButton className="h-10" onClick={() => navigate.push(`/monitoring/${position.position}/forceSell`)}>
					Bid
				</AppButton>
			}
		>
			{/* Collateral */}
			<div className="flex flex-col max-md:mb-5">
				{/* desktop view */}
				<div className="max-md:hidden flex flex-row items-center -ml-12">
					<span className="mr-4 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</span>
					<span className={`col-span-2 text-md text-text-primary`}>{`${formatCurrency(balance)} ${position.collateralSymbol}`}</span>
				</div>

				{/* mobile view */}
				<AppBox className="md:hidden flex flex-row items-center">
					<div className="mr-4 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</div>
					<div className={`col-span-2 text-md text-text-primary font-semibold`}>{`${formatCurrency(balance)} ${position.collateralSymbol}`}</div>
				</AppBox>
			</div>

			{/* Current Price */}
			<div className="flex flex-col">
				<div className="text-md">~{formatCurrency(currentPriceFormatted, 2, 2)} ZCHF</div>
			</div>

			{/* State */}
			<div className="flex flex-col">
				<div className="text-md">{states[stateIdx]}</div>
			</div>

			{/* Time Left */}
			<div className="flex flex-col">
				<div className={`text-md`}>{stateTimeLeft}</div>
			</div>
		</TableRow>
	);
}
