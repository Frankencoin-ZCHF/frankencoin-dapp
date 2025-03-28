import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { BidsQueryItem, ChallengesId } from "@frankencoin/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "../../utils/format";
import { useContractUrl } from "@hooks";
import { useRouter as useNavigation } from "next/navigation";
import Button from "@components/Button";
import { useAccount } from "wagmi";
import AppBox from "@components/AppBox";

interface Props {
	headers: string[];
	tab: string;
	bid: BidsQueryItem;
}

export default function MyPositionsBidsRow({ headers, tab, bid }: Props) {
	const positions = useSelector((state: RootState) => state.positions.mapping);
	const challenges = useSelector((state: RootState) => state.challenges.mapping);

	const pid = bid.position.toLowerCase() as Address;
	const cid = `${pid}-challenge-${bid.number}` as ChallengesId;

	const position = positions.map[pid];
	const challenge = challenges.map[cid];
	const url = useContractUrl(position.collateral || zeroAddress);
	const account = useAccount();
	const navigate = useNavigation();
	if (!position || !challenge) return null;

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	const isDisabled: boolean = challenge.status !== "Active" || account.address !== bid.bidder;

	return (
		<TableRow
			headers={headers}
			paddingY={!isDisabled ? "md:py-1 max-md:py-4" : undefined}
			tab={tab}
			actionCol={
				isDisabled ? (
					<></>
				) : (
					<div className="">
						<Button
							className="h-10"
							disabled={isDisabled}
							onClick={() => navigate.push(`/monitoring/${challenge.position.toLowerCase()}/auction/${challenge.number}`)}
						>
							Buy Again
						</Button>
					</div>
				)
			}
		>
			{/* Collateral */}
			<div className="flex flex-col max-md:mb-5">
				{/* desktop view */}
				<div className="max-md:hidden flex flex-row items-center -ml-12">
					<span className="mr-4 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</span>
					<span className={`col-span-2 text-md`}>{`${formatCurrency(formatUnits(bid.filledSize, position.collateralDecimals))} ${
						position.collateralSymbol
					}`}</span>
				</div>

				{/* mobile view */}
				<AppBox className="md:hidden flex flex-row items-center">
					<div className="mr-4 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</div>
					<div className={`col-span-2 text-md`}>{`${formatCurrency(formatUnits(bid.filledSize, position.collateralDecimals))} ${
						position.collateralSymbol
					}`}</div>
				</AppBox>
			</div>

			{/* Price */}
			<div className="flex flex-col">
				<div className="text-md">{formatCurrency(formatUnits(bid.price, 36 - position.collateralDecimals), 2, 2)} ZCHF</div>
			</div>

			{/* Bid */}
			<div className="flex flex-col">
				<div className="text-md">{`${formatCurrency(formatUnits(bid.bid, 18), 2, 2)} ZCHF`}</div>
			</div>

			{/* State */}
			<div className="flex flex-col">
				<div className="text-md">{bid.bidType}</div>
			</div>
		</TableRow>
	);
}
