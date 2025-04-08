import { formatUnits } from "viem";
import { useSelector } from "react-redux";
import { PriceQuery } from "@deuro/api";
import { useTranslation } from "next-i18next";
import { RootState } from "../../redux/redux.store";
import { formatCurrency } from "@utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { TokenModalRowButton, TokenSelectModal } from "@components/TokenSelectModal";

interface TokenOption {
	symbol: string;
	name: string;
	address: string;
	balanceOf: bigint;
	decimals: number;
}

type SelectCollateralModalProps<T extends TokenOption> = {
	title: string;
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	options: T[];
	onTokenSelect: (option: T, index: number, options: T[]) => void;
	additionalRows?: React.ReactNode;
};

export function SelectCollateralModal<T extends TokenOption>({
	title,
	isOpen,
	setIsOpen,
	options,
	onTokenSelect,
}: SelectCollateralModalProps<T>) {
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const { t } = useTranslation();

	const handleTokenSelect = (option: T, index: number, options: T[]) => {
		onTokenSelect(option, index, options);
		setIsOpen(false);
	};

	const getPriceByAddress = (address: string, decimals: number, balance: bigint) => {
		const price = Object.values(prices).find((price: PriceQuery) => price.address.toLowerCase() === address.toLowerCase());
		if (!price || !price.price?.usd) return "--";
		return formatCurrency(price.price.usd * (Number(balance) / 10 ** decimals));
	};

	return (
		<TokenSelectModal title={title} isOpen={isOpen} setIsOpen={setIsOpen}>
			<div className="h-full">
				{options.length > 0 &&
					options.map((option, i, optList) => (
						<TokenModalRowButton
							key={`${option.symbol}-${i}`}
							symbol={option.symbol}
							price={getPriceByAddress(option.address, option.decimals, option.balanceOf) || "0"}
							balance={formatUnits(option.balanceOf ?? 0n, option.decimals)}
							name={option.name}
							onClick={() => handleTokenSelect(option, i, optList)}
						/>
					))}
				<div className="flex flex-row justify-center items-center w-full border-t border-card-content-secondary mt-1 pt-1">
					<Link
						href="/mint/create"
						className="text-base leading-tight py-3 px-3 flex flex-row justify-center items-center w-full hover:bg-card-content-secondary rounded-lg"
					>
						<FontAwesomeIcon icon={faPlus} className="mr-2" />
						<span className="text-base leading-tight">{t("mint.add_new_token")}</span>
					</Link>
				</div>
			</div>
		</TokenSelectModal>
	);
}
