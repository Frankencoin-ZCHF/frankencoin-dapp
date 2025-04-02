import { formatUnits } from "viem";
import { NATIVE_POOL_SHARE_TOKEN_SYMBOL, POOL_SHARE_TOKEN_SYMBOL, TOKEN_SYMBOL } from "@utils";
import { TokenModalRowButton, TokenSelectModal } from "@components/TokenSelectModal";
import { TokenBalance } from "../../hooks/useWalletBalances";


type SelectAssetModalProps = {
	title: string;
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	balances: TokenBalance[];
	onTokenSelect: (symbol: string) => void;
};

export function SelectAssetModal({
	title,
	isOpen,
	setIsOpen,
	balances,
	onTokenSelect,
}: SelectAssetModalProps) {

	const handleTokenSelect = (symbol: string) => {
		onTokenSelect(symbol);
		setIsOpen(false);
	};

	const getPriceBySymbol = (symbol: string) => {
		const w = balances.find((balance) => balance.symbol === symbol);
		if (!w) return "--";        
        return formatUnits(w.balanceOf ?? 0n, w.decimals);
	};

    const options = [
        {
            symbol: TOKEN_SYMBOL,
            name: "Decentralized Euro",
            balanceOf: balances.find((balance) => balance.symbol === TOKEN_SYMBOL)?.balanceOf ?? 0n,
        },
        {
            symbol: POOL_SHARE_TOKEN_SYMBOL,
            name: POOL_SHARE_TOKEN_SYMBOL,
            balanceOf: balances.find((balance) => balance.symbol === POOL_SHARE_TOKEN_SYMBOL)?.balanceOf ?? 0n,
        },
        {
            symbol: NATIVE_POOL_SHARE_TOKEN_SYMBOL,
            name: NATIVE_POOL_SHARE_TOKEN_SYMBOL,
            balanceOf: balances.find((balance) => balance.symbol === NATIVE_POOL_SHARE_TOKEN_SYMBOL)?.balanceOf ?? 0n,
        },
    ]

	return (
		<TokenSelectModal title={title} isOpen={isOpen} setIsOpen={setIsOpen}>
			<div className="h-full">
				{options.length > 0 &&
					options.map((option, i) => (
						<TokenModalRowButton
							key={`${option.symbol}-${i}`}
							symbol={option.symbol}
							price={getPriceBySymbol(option.symbol)}
							balance={formatUnits(option.balanceOf ?? 0n, 18)}  
							name={option.name}
							onClick={() => handleTokenSelect(option.symbol)}
						/>
					))}
			</div>
		</TokenSelectModal>
	);
}
