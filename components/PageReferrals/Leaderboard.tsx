import { formatCurrency, getReferralNameFromFrontendCode } from "@utils";
import Table from "../Table";
import TableBody from "../Table/TableBody";
import TableHeader from "../Table/TableHead";
import TableRow from "../Table/TableRow";
import TableRowEmpty from "../Table/TableRowEmpty";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { TableShowMoreRow } from "@components/Table/TableShowMoreRow";
import { SectionTitle } from "@components/SectionTitle";
import { useTranslation } from "next-i18next";
import { gql, useQuery } from "@apollo/client";
import { formatUnits } from "viem";

interface LeaderboardData {
	refCode: string;
	referrals: number;
	loansVolume: string;
	investVolume: string;
	savingsVolume: string;
	totalVolume: string;
}

const subHeaders = ["", "", "dEURO", "dEURO", "dEURO", "dEURO"];

export default function Leaderboard() {
	const { t } = useTranslation();
	const headers = [t("referrals.ref_name"), t("referrals.referrals"), t("referrals.loans_volume"), t("referrals.invest_volume"), t("referrals.savings_volume"), t("referrals.total_volume")];
	const [isShowMore, setIsShowMore] = useState(false);
	const [tab, setTab] = useState<string>(headers[5]);
	const [reverse, setReverse] = useState<boolean>(false);

	const { data: leaderboardData } = useQuery(
		gql`
			{
				frontendRewardsMappings(where: {}, orderBy: "totalVolume", orderDirection: "desc") {
					items {
						id
						totalReffered
						loansVolume
						investVolume
						savingsVolume
					}
				}
			}
		`,
		{
			pollInterval: 0,
		}
	);

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			if (e === headers[1]) setReverse(true);
			else setReverse(false);

			setTab(e);
		}
	};

	const leaderboard = leaderboardData?.frontendRewardsMappings?.items || [];
	const data: LeaderboardData[] = leaderboard
		.filter((item: any) => item.id.toLowerCase() !== "0x0000000000000000000000000000000000000000000000000000000000000000")
		.map((item: any) => {
			const totalRevenue = BigInt(item.loansVolume) + BigInt(item.investVolume) + BigInt(item.savingsVolume);
			return {
				refCode:
					getReferralNameFromFrontendCode(item.id) || `${item.id.substring(0, 3)}...${item.id.substring(item.id.length - 7)}`,
				referrals: item.totalReffered,
				loansVolume: formatCurrency(formatUnits(BigInt(item.loansVolume), 18)),
				investVolume: formatCurrency(formatUnits(BigInt(item.investVolume), 18)),
				savingsVolume: formatCurrency(formatUnits(BigInt(item.savingsVolume), 18)),
				totalVolume: formatCurrency(formatUnits(totalRevenue, 18)),
			};
		});

	const sortedData = sortLeaderboard({ leaderboard: [...data], headers, tab, reverse });

	return (
		<div className="flex flex-col gap-2 sm:gap-0">
			<SectionTitle id="referral-leaderboard">{t("referrals.referral_leaderboard")}</SectionTitle>
			<Table>
				<TableHeader headers={headers} subHeaders={subHeaders} tab={tab} tabOnChange={handleTabOnChange} reverse={reverse} />
				<TableBody>
					<>
						{sortedData.length === 0 ? (
							<TableRowEmpty>{t("referrals.no_bonus_history_yet")}</TableRowEmpty>
						) : (
							sortedData.slice(0, isShowMore ? data.length : 5).map((row, i) => (
								<TableRow key={i} headers={headers} tab={tab}>
									<div className="text-base sm:font-medium leading-tight text-left">{row.refCode}</div>
									<div className="text-base sm:font-medium leading-tight">{row.referrals}</div>
									<div className="text-base sm:font-medium leading-tight">{row.loansVolume}</div>
									<div className="text-base sm:font-medium leading-tight">{row.investVolume}</div>
									<div className="text-base sm:font-medium leading-tight">{row.savingsVolume}</div>
									<div className="text-base sm:font-medium leading-tight">{row.totalVolume}</div>
								</TableRow>
							))
						)}
						{sortedData.length > 5 && (
							<TableShowMoreRow onShowMoreClick={() => setIsShowMore(!isShowMore)}>
								<div className="text-table-header-active text-base font-black leading-normal tracking-tight">
									{isShowMore ? t("referrals.show_less") : t("referrals.show_more")}
								</div>
								<div className="justify-start items-center gap-2.5 flex">
									<FontAwesomeIcon icon={isShowMore ? faMinus : faPlus} className="w-4 h-4 text-table-header-active" />
								</div>
							</TableShowMoreRow>
						)}
					</>
				</TableBody>
			</Table>
		</div>
	);
}

function sortLeaderboard(params: { leaderboard: LeaderboardData[]; headers: string[]; tab: string; reverse: boolean }): LeaderboardData[] {
	const { leaderboard, headers, tab, reverse } = params;

	if (tab === headers[0]) {
		// refCode
		leaderboard.sort((a, b) => a.refCode.localeCompare(b.refCode));
	} else if (tab === headers[1]) {
		// referrals
		leaderboard.sort((a, b) => a.referrals - b.referrals);
	} else if (tab === headers[2]) {
		// loansVolume
		leaderboard.sort((a, b) => Number(b.loansVolume) - Number(a.loansVolume));
	} else if (tab === headers[3]) {
		// investVolume
		leaderboard.sort((a, b) => Number(b.investVolume) - Number(a.investVolume));
	} else if (tab === headers[4]) {
		// savingsVolume
		leaderboard.sort((a, b) => Number(b.savingsVolume) - Number(a.savingsVolume));
	} else if (tab === headers[5]) {
		// totalVolume
		leaderboard.sort((a, b) => Number(b.totalVolume) - Number(a.totalVolume));
	}

	return reverse ? leaderboard.reverse() : leaderboard;
}
