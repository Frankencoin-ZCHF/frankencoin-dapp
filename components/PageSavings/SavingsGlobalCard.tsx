import AppBox from "@components/AppBox";
import AppCard from "@components/AppCard";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ADDRESS } from "@deuro/eurocoin";
import { useChainId } from "wagmi";
import { useContractUrl } from "@hooks";
import { shortenAddress, TOKEN_SYMBOL } from "@utils";
import Link from "next/link";
import { useTranslation } from "next-i18next";

export default function SavingsGlobalCard() {
	const savingsInfo = useSelector((state: RootState) => state.savings.savingsInfo);
	const { t } = useTranslation();

	const moduleAddress = ADDRESS[useChainId()].savingsGateway;
	const url = useContractUrl(moduleAddress);

	return (
		<AppCard>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
				<AppBox>
					<DisplayLabel label={t("savings.current_interest_rate")} />
					{savingsInfo ? (
						<DisplayAmount className="mt-1" amount={savingsInfo.rate / 10_000} currency="%" hideLogo />
					) : (
						<div className="mt-1 text-base leading-5">-</div>
					)}
				</AppBox>
				<AppBox>
					<DisplayLabel label={t("savings.total_savings")} />
					{savingsInfo ? (
						<DisplayAmount className="mt-1" amount={savingsInfo.totalBalance} currency={TOKEN_SYMBOL} hideLogo />
					) : (
						<div className="mt-1 text-base leading-5">-</div>
					)}
				</AppBox>
				<AppBox>
					<DisplayLabel label={t("savings.module_contract")} />
					<Link href={url} target="_blank">
						<div className="mt-1">
							{shortenAddress(moduleAddress)}
							<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
						</div>
					</Link>
				</AppBox>
			</div>
		</AppCard>
	);
}
