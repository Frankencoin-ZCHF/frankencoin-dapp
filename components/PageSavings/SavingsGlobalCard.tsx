import AppBox from "@components/AppBox";
import AppCard from "@components/AppCard";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ADDRESS, FrankencoinABI, SavingsABI } from "@frankencoin/zchf";
import { useChainId } from "wagmi";
import { useContractUrl } from "@hooks";
import { shortenAddress } from "@utils";;
import Button from "@components/Button";
import Link from "next/link";

export default function SavingsGlobalCard() {
	const { totalBalance, totalSaved, totalWithdrawn, totalInterest, rate, ratioOfSupply } = useSelector(
		(state: RootState) => state.savings.savingsInfo
	);

	const moduleAddress = ADDRESS[useChainId()].savings;
	const url = useContractUrl(moduleAddress);

	return (
		<AppCard>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
				<AppBox>
					<DisplayLabel label="Current Interest Rate" />
					<DisplayAmount className="mt-1" amount={rate / 10_000} currency="%" hideLogo />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Savings" />
					<DisplayAmount className="mt-1" amount={totalBalance} currency="ZCHF" hideLogo />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Module Contract" />
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
