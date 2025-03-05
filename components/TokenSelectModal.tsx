import TokenLogo from "@components/TokenLogo";
import { Modal } from "flowbite-react";
import { formatUnits } from "viem";
import { useSelector } from "react-redux";
import { RootState } from "../redux/redux.store";
import { PriceQuery } from "@deuro/api";
import { formatCurrency } from "../utils/format";
import Link from "next/link";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
interface TokenOption {
	symbol: string;
	name: string;
	address: string;
	balanceOf: bigint;
	decimals: number;
}

type TokenSelectModalProps<T extends TokenOption> = {
	title: string;
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	options: T[];
	onTokenSelect: (option: T, index: number, options: T[]) => void;
};

export function TokenSelectModal<T extends TokenOption>({ title, isOpen, setIsOpen, options, onTokenSelect }: TokenSelectModalProps<T>) {
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
		<Modal
			show={isOpen}
			onClose={() => setIsOpen(false)}
			size="md"
			theme={{
				root: {
					base: "fixed inset-x-0 top-0 z-50 h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
				},
				content: {
					base: "relative max-h-[80%] w-full md:max-h-[80%]",
					inner: "relative flex h-full flex-col rounded-lg bg-white shadow dark:bg-gray-700",
				},
			}}
		>
			<Modal.Header
				theme={{
					base: "flex items-center justify-between rounded-t px-6 pt-2 pb-0",
					title: "text-lg font-extrabold leading-tight align-middle",
					close: {
						base: "p-1.5 pr-0 ml-auto inline-flex items-center rounded-lg bg-transparent",
						icon: "h-6 w-6",
					},
				}}
			>
				<div className="text-lg font-extrabold leading-tight align-middle">{title}</div>
			</Modal.Header>
			<Modal.Body theme={{ base: "flex flex-col px-3 py-2 overflow-y-auto no-scrollbar" }}>
				<div className="h-full">
					{options.length > 0 &&
						options.map((option, i, optList) => (
							<button
								key={`${option.symbol}-${i}`}
								className="self-stretch py-3 px-3 flex flex-row justify-start items-center w-full hover:bg-card-content-secondary rounded-lg"
								onClick={() => handleTokenSelect(option, i, optList)}
							>
								<span className="pr-3 self-center flex-shrink-0">
									<TokenLogo currency={option.symbol} size={8} />
								</span>
								<div className="flex flex-col self-stretch justify-start items-start max-h-10 min-w-0 w-full">
									<div className="flex flex-row self-stretch justify-between items-start w-full">
										<span className="text-base leading-tight font-extrabold truncate">{option.symbol}</span>
										<span className="text-base leading-tight font-extrabold ml-2 flex-shrink-0">
											${getPriceByAddress(option.address, option.decimals, option.balanceOf)}
										</span>
									</div>
									<div className="flex flex-row gap-2 self-stretch justify-between items-center w-full">
										<span className="text-base leading-tight text-text-muted truncate max-w-[60%]">
											{option.name}
										</span>
										<span className="text-base leading-tight text-text-muted flex-shrink-0">
											{formatUnits(option.balanceOf ?? 0n, option.decimals)}
										</span>
									</div>
								</div>
							</button>
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
			</Modal.Body>
		</Modal>
	);
}
