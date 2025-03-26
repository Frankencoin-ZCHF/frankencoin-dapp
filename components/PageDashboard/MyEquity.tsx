import TokenLogo from "@components/TokenLogo";
import { useTranslation } from "next-i18next";
import { HeaderCell, LinkTitle, NoDataRow } from "./SectionTable";
import { useWalletERC20Balances } from "../../hooks/useWalletBalances";
import { formatCurrency, NATIVE_POOL_SHARE_TOKEN_SYMBOL, POOL_SHARE_TOKEN_SYMBOL } from "@utils";
import { ADDRESS, EquityABI } from "@deuro/eurocoin";
import { useChainId, useReadContract } from "wagmi";
import { formatUnits, zeroAddress } from "viem";
import { useRouter } from "next/router";
import { getPublicViewAddress } from "../../utils/url";

const EquityRow = ({
	symbol,
	currentInvestment = "0.00",
	amount = "0.00",
}: {
	symbol: string;
	currentInvestment: string;
	amount: string;
}) => {
	return (
		<>
			<div className="flex items-center py-1.5">
				<span className="flex items-center pr-3">
					<TokenLogo currency={symbol} size={8} />
				</span>
			</div>
			<span className="flex items-center text-text-primary text-base font-medium leading-[1.25rem]">
				{currentInvestment} {symbol}
			</span>
			<span className="flex items-center justify-end text-text-primary text-base font-extrabold leading-[1.25rem]">{amount}</span>
		</>
	);
};

export const MyEquity = () => {
	const { t } = useTranslation();
	const chainId = useChainId();
	const router = useRouter();
	const overwrite = getPublicViewAddress(router);

	const { balancesByAddress } = useWalletERC20Balances([
		{
			name: NATIVE_POOL_SHARE_TOKEN_SYMBOL,
			symbol: NATIVE_POOL_SHARE_TOKEN_SYMBOL,
			address: ADDRESS[chainId].equity,
		},
		{
			name: POOL_SHARE_TOKEN_SYMBOL,
			symbol: POOL_SHARE_TOKEN_SYMBOL,
			address: ADDRESS[chainId].DEPSwrapper,
		},
	], { accountAddress: overwrite as `0x${string}` });

	const { data: deuroNative = 0n } = useReadContract({
		address: ADDRESS[chainId].equity,
		abi: EquityABI,
		functionName: "calculateProceeds",
		args: [balancesByAddress[ADDRESS[chainId].equity]?.balanceOf || 0n],
	});

	const { data: deuroWrapped = 0n } = useReadContract({
		address: ADDRESS[chainId].equity,
		abi: EquityABI,
		functionName: "calculateProceeds",
		args: [balancesByAddress[ADDRESS[chainId].DEPSwrapper]?.balanceOf || 0n],
	});

	const equityData = [
		{
			symbol: "nDEPS",
			currentInvestment: formatCurrency(formatUnits(balancesByAddress[ADDRESS[chainId].equity]?.balanceOf || 0n, 18)) as string,
			amount: formatCurrency(formatUnits(deuroNative, 18)) as string,
		},
		{
			symbol: "DEPS",
			currentInvestment: formatCurrency(formatUnits(balancesByAddress[ADDRESS[chainId].DEPSwrapper]?.balanceOf || 0n, 18)) as string,
			amount: formatCurrency(formatUnits(deuroWrapped, 18)) as string,
		},
	];

	const totalInvested = deuroNative + deuroWrapped;
	const isEquityData = totalInvested > 0;

	return (
		<div className="w-full h-full p-4 sm:p-8 flex flex-col items-start">
			<LinkTitle href={"/equity"}>{t("dashboard.my_equity")}</LinkTitle>
			<div className="w-full flex flex-row justify-between items-center">
				<div className="w-full grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto]">
					{/** Headers */}
					<span></span>
					<HeaderCell>{t("dashboard.current_investment")}</HeaderCell>
					<HeaderCell className="text-right">{t("dashboard.symbol_amount", { symbol: "dEURO" })}</HeaderCell>
					{isEquityData ? (
						equityData.map((item) => <EquityRow key={item.symbol} {...item} />)
					) : (
						<NoDataRow className="col-span-2">{t("dashboard.no_investments_yet")}</NoDataRow>
					)}
				</div>
			</div>
			{isEquityData && (
				<div className="w-full pt-5 flex-1 flex items-end">
					<div className="flex flex-row justify-between items-center w-full">
						<span className="text-text-primary text-base font-extrabold leading-[1.25rem]">
							{t("dashboard.total_invested")}
						</span>
						<span className="text-text-primary text-base font-extrabold leading-[1.25rem]">
							{formatCurrency(formatUnits(totalInvested, 18)) as string}
						</span>
					</div>
				</div>
			)}
		</div>
	);
};
