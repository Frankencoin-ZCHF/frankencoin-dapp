import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { track } from "../hooks/useAnalytics";

export interface BuyZchfOption {
	key: string;
	name: string;
	type: string;
	// button label in the compact variant
	label: string;
	description: string;
	href: string;
}

// Same partners and links as frankencoin.com (exchanges & on-ramps, start page). Keep both in sync.
export const BUY_ZCHF_OPTIONS: BuyZchfOption[] = [
	{
		key: "kraken",
		name: "Kraken",
		type: "Exchange",
		label: "Kraken",
		description: "Buy ZCHF on the exchange and withdraw it to your own wallet.",
		href: "https://www.kraken.com/buy/zchf",
	},
	{
		key: "mtpelerin",
		name: "Mt Pelerin",
		type: "Bank transfer",
		label: "Bank transfer · Mt Pelerin",
		description: "Swiss-regulated on-ramp. Pay from a Swiss or SEPA account, 0% fees.",
		href: "https://www.mtpelerin.com/buy-zchf-frankencoin",
	},
	{
		key: "dfx",
		name: "DFX",
		type: "Bank transfer",
		label: "Bank transfer · DFX",
		description: "Swiss on-ramp. Bank transfer in, ZCHF straight to your wallet.",
		href: "https://dfx.swiss/app?type=buy&asset-out=ZCHF",
	},
	{
		key: "etherfi",
		name: "ether.fi",
		type: "Bank transfer",
		label: "Bank transfer · ether.fi",
		description: "Send CHF to your personal Swiss IBAN in ether.fi and receive ZCHF.",
		href: "https://www.ether.fi/app/cash/bank/chf",
	},
	{
		key: "swap",
		name: "CoW Swap",
		type: "Swap",
		label: "Swap crypto",
		description: "Already hold USDC, USDT or ETH? Swap it for ZCHF on Ethereum.",
		href: "https://swap.cow.fi/#/1/swap/USDC/ZCHF",
	},
];

interface Props {
	// "cards" lists every option with a description, "buttons" is a compact row for use inside other cards
	variant?: "cards" | "buttons";
	title?: string;
	text?: string;
	// where the offer is shown, used for analytics only
	source: string;
	className?: string;
}

/** The ways to get ZCHF from outside the app. One list, shown on Start, Earn and Invest. */
export default function BuyZchf({ variant = "buttons", title, text, source, className }: Props) {
	const onClick = (key: string) => track(`buy_zchf_${key}`, { source });

	if (variant == "cards") {
		return (
			<div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 ${className ?? ""}`}>
				{BUY_ZCHF_OPTIONS.map((o) => (
					<a
						key={o.key}
						href={o.href}
						target="_blank"
						rel="noreferrer"
						onClick={() => onClick(o.key)}
						className="group flex flex-col gap-1 rounded-lg p-4 border border-card-input-border bg-card-body-primary hover:border-card-input-focus transition-colors"
					>
						<span className="text-xs tracking-wider font-bold text-card-input-focus">{o.type.toUpperCase()}</span>
						<span className="text-lg font-black text-text-primary">
							{o.name}
							<FontAwesomeIcon
								icon={faArrowUpRightFromSquare}
								className="w-3 ml-2 text-text-secondary group-hover:text-card-input-focus"
							/>
						</span>
						<span className="text-sm text-text-secondary">{o.description}</span>
					</a>
				))}
			</div>
		);
	}

	return (
		<div className={`flex flex-col gap-3 ${className ?? ""}`}>
			{title || text ? (
				<div>
					{title ? <div className="font-bold text-text-primary">{title}</div> : null}
					{text ? <div className="text-sm text-text-secondary">{text}</div> : null}
				</div>
			) : null}
			<div className="flex flex-wrap gap-2">
				{BUY_ZCHF_OPTIONS.map((o) => (
					<a
						key={o.key}
						href={o.href}
						target="_blank"
						rel="noreferrer"
						onClick={() => onClick(o.key)}
						className="btn w-auto grow sm:grow-0 px-3 py-1.5 md:px-3 md:py-1.5 text-sm bg-transparent border-2 border-button-disabled text-text-primary hover:border-button-hover hover:bg-button-hover hover:text-white"
					>
						{o.label}
					</a>
				))}
			</div>
		</div>
	);
}
