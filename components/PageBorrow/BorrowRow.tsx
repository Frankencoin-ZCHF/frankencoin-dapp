import { Address } from "viem";
import TableRow from "../Table/TableRow";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "../../utils/format";
import { PositionQuery } from "@frankencoin/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BadgeCloneColor, BadgeOriginalColor } from "../../utils/customTheme";
import { faCertificate } from "@fortawesome/free-solid-svg-icons";

interface Props {
	position: PositionQuery;
}

export default function BorrowRow({ position }: Props) {
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const zchfPrice = prices[position.zchf.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !zchfPrice) return null;

	const interest: number = Math.round((position.annualInterestPPM / 10 ** 4) * 100) / 100;
	const reserve: number = Math.round((position.reserveContribution / 10 ** 4) * 100) / 100;

	const available: number = Math.round((parseInt(position.availableForClones) / 10 ** position.zchfDecimals) * 100) / 100;
	const availableK: string = formatCurrency((Math.round(available / 100) / 10).toString(), 2) + "k";
	const price: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const since: number = Math.round((Date.now() - position.start * 1000) / 1000 / 60 / 60 / 24);
	const maturity: number = Math.round((position.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24);
	const maturityStatusColors = maturity > 60 ? "text-green-300" : maturity < 30 ? "text-red-500" : "text-red-300";

	const startStr = new Date(position.start * 1000).toDateString().split(" ");
	const startString: string = `${startStr[2]} ${startStr[1]} ${startStr[3]} (${since}d)`;

	const balance: number = Math.round((parseInt(position.collateralBalance) / 10 ** position.collateralDecimals) * 100) / 100;
	const balanceZCHF: number = Math.round(((balance * collTokenPrice) / zchfPrice) * 100) / 100;
	const ballanceUSD: number = Math.round(balance * collTokenPrice * 100) / 100;

	const liquidationZCHF: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const liquidationUSD: number = Math.round(liquidationZCHF * zchfPrice * 100) / 100;
	const liquidationPct: number = Math.round((balanceZCHF / (liquidationZCHF * balance)) * 10000) / 100;
	const liauidationStatusColors = liquidationPct < 100 ? "text-red-500" : liquidationPct < 120 ? "text-red-300" : "text-green-300";

	const expirationStr = new Date(position.expiration * 1000).toDateString().split(" ");
	const expirationString: string = `${expirationStr[2]} ${expirationStr[1]} ${expirationStr[3]} (${maturity}d)`;

	// effectiveLTC = liquidation price * (1 - reserve) / market price
	const effectiveLTC: number = Math.round(((price * (1 - reserve / 100)) / collTokenPrice) * 10000) / 100;
	const effectiveInterest: number = Math.round((interest / (1 - reserve / 100)) * 100) / 100;

	return (
		<TableRow link={`/borrow/position/${position.position}`}>
			<div className="flex flex-col gap-4">
				<div className="relative col-span-2 w-16 h-16 max-h-16 max-w-16 rounded-xl my-auto">
					<TokenLogo currency={position.collateralSymbol.toLowerCase()} size={16} />
					<FontAwesomeIcon
						className="absolute top-12 left-12"
						color={position.isOriginal ? BadgeOriginalColor : BadgeCloneColor}
						icon={faCertificate}
					/>
				</div>
				<div>
					<div className="text-sm font-bold text-text-subheader w-16 text-center">{position.collateralSymbol}</div>
				</div>
			</div>

			<div className="flex flex-col gap-2 text-text-subheader">
				<div className="col-span-2 text-md font-bold text-text-header">{formatCurrency(effectiveLTC, 2, 2)}%</div>
				<div>{formatCurrency(reserve, 2, 2)}%</div>
			</div>

			<div className="flex flex-col gap-2 text-text-subheader">
				<div className="col-span-2 text-md font-bold text-text-header">{formatCurrency(effectiveInterest, 2, 2)}%</div>
				<div>{formatCurrency(interest, 2, 2)}%</div>
			</div>

			<div className="flex flex-col gap-2 text-text-subheader">
				<div className="col-span-2 text-md font-bold text-text-header">{formatCurrency(price, 2, 2)} ZCHF</div>
				<div className={`col-span-2 text-md ${liauidationStatusColors}`}>
					{formatCurrency(collTokenPrice / zchfPrice, 2, 2)} ZCHF
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-md font-bold text-text-header">{formatCurrency(available / 1000, 2, 2)}k ZCHF</div>
				<div className={`${maturityStatusColors}`}>{maturity > 0 ? expirationString : "Matured"}</div>
			</div>
		</TableRow>
	);
}
