import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { MinterQuery, PositionQuery, PriceQuery, PriceQueryObjectArray } from "@frankencoin/api";
import { formatCurrency, shortenAddress } from "../../utils/format";
import { useContractUrl } from "@hooks";
import Button from "@components/Button";
import AddressLabel from "@components/AddressLabel";
import { VoteData } from "./GovernanceVotersTable";
import GovernancePositionsAction from "./GovernancePositionsAction";

interface Props {
	position: PositionQuery;
	prices: PriceQueryObjectArray;
}

export default function GovernancePositionsRow({ position, prices }: Props) {
	const urlPosition = useContractUrl(position.position || zeroAddress);
	const urlCollateral = useContractUrl(position.collateral || zeroAddress);
	const price = prices[position.collateral.toLowerCase() as Address];
	if (!position || !price) return null;

	const openPosition = (e: any) => {
		e.preventDefault();
		window.open(urlPosition, "_blank");
	};
	const openCollateral = (e: any) => {
		e.preventDefault();
		window.open(urlCollateral, "_blank");
	};

	return (
		<TableRow
			actionCol={
				<div className="">
					<GovernancePositionsAction key={position.position} position={position} />
				</div>
			}
		>
			{/* Owner */}
			<div className="flex items-center">
				<AddressLabel address={position.position} showCopy showLink />
			</div>

			<div className="flex items-center">{position.collateralName}</div>
			<div className="flex items-center">{position.collateralSymbol}</div>
		</TableRow>
	);
}
