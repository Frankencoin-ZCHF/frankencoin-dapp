import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ADDRESS, ERC20ABI } from "@deuro/eurocoin";
import { useChainId, useReadContract } from "wagmi";
import { formatCurrency, shortenAddress } from "@utils";
import { formatUnits } from "@ethersproject/units";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { useContractUrl } from "@hooks";

const StatsBox = ({ title, value, isLast }: { title: string; value?: string | React.ReactNode; isLast?: boolean }) => {
	return (
		<div
			className={`2md:p-8 p-5 flex flex-col 2md:gap-2 gap-1 flex-1 ${
				!isLast ? "border-r border-borders-dividerLight" : ""
			}`}
		>
			<span className="text-base font-[350] leading-tight">{title}</span>
			<span className="text-lg font-[900]">{value}</span>
		</div>
	);
};

const SavingsOverview = () => {
	const { rate, totalInterest } = useSelector((state: RootState) => state.savings.savingsInfo);
	const chainId = useChainId();
	const addressSavingsGateway = useContractUrl(ADDRESS[chainId].savingsGateway);
	const { t } = useTranslation();

	const { data: totalSavings = 0n } = useReadContract({
		address: ADDRESS[chainId].decentralizedEURO,
		abi: ERC20ABI,
		functionName: "balanceOf",
		args: [ADDRESS[chainId].savingsGateway],
	});

	return (
		<div className="w-full bg-white self-stretch rounded-xl justify-start items-center inline-flex shadow-card">
			<div className="w-full flex md:flex-row flex-col">
				<div className="w-full flex-row justify-start items-start flex overflow-hidden">
					<StatsBox title={t("dashboard.interest_rate_apr")} value={`${rate / 10_000}%`} />
					<StatsBox title={t("dashboard.total_savings")} value={formatCurrency(formatUnits(totalSavings, 18)) || undefined} />
				</div>
				<div className="w-full flex-row justify-start items-start flex overflow-hidden">
					<StatsBox title={t("dashboard.total_interest_paid")} value={formatCurrency(totalInterest) || undefined} />
					<StatsBox
						title={t("dashboard.contract_address")}
						value={
							<Link href={addressSavingsGateway} target="_blank">
								{shortenAddress(ADDRESS[chainId].savingsGateway)}{" "}
								<FontAwesomeIcon icon={faArrowUpRightFromSquare} size="xs" />
							</Link>
						}
					/>
				</div>
			</div>
		</div>
	);
};

export default SavingsOverview;
