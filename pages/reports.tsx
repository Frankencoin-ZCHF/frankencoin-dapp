import Head from "next/head";
import { useAccount } from "wagmi";
import AppTitle from "@components/AppTitle";
import AddressInput from "@components/Input/AddressInput";
import { useEffect, useState } from "react";
import AppCard from "@components/AppCard";
import { Address, isAddress, zeroAddress } from "viem";
import { FRANKENCOIN_API_CLIENT } from "../app.config";
import { ApiSavingsUserTable } from "@frankencoin/api";
import ReportsSavingsYearlyTable from "@components/PageReports/ReportsSavingsYearlyTable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FPSBalanceHistory } from "../hooks/FPSBalanceHistory";
import { FPSEarningsHistory } from "../hooks/FPSEarningsHistory";
import ReportsFPSYearlyTable from "@components/PageReports/ReportsFPSYearlyTable";
import ReportsPositionsYearlyTable from "@components/PageReports/ReportsPositionsYearlyTable";

export type OwnerPositionFees = {
	t: number;
	f: bigint;
};

export default function ReportsPage() {
	const { address } = useAccount();
	const [isLoading, setLoading] = useState<boolean>(false);
	const [reportingAddress, setReportingAddress] = useState<string>(address ?? zeroAddress);
	const [ownerPositionFees, setOwnerPositionFees] = useState<OwnerPositionFees[]>([]);
	const [savings, setSavings] = useState<ApiSavingsUserTable>({ save: [], interest: [], withdraw: [] });
	const [fpsHistory, setFpsHistory] = useState<FPSBalanceHistory[]>([]);
	const [fpsEarnings, setFpsEarnings] = useState<FPSEarningsHistory[]>([]);

	useEffect(() => {
		if (!isAddress(reportingAddress)) return;
		setLoading(true);

		const fetcher = async () => {
			const responseOwnerPosition = await FRANKENCOIN_API_CLIENT.get(`/positions/mintingupdates/owner/${reportingAddress}/fees`);
			setOwnerPositionFees((responseOwnerPosition.data as { t: number; f: string }[]).map((i) => ({ t: i.t, f: BigInt(i.f) })));

			const responseSavings = await FRANKENCOIN_API_CLIENT.get(`/savings/core/user/${reportingAddress}`);
			setSavings(responseSavings.data as ApiSavingsUserTable);

			const responseBalance = await FPSBalanceHistory(reportingAddress);
			setFpsHistory(responseBalance.reverse());

			const responseEarnings = await FPSEarningsHistory(reportingAddress);
			setFpsEarnings(responseEarnings.reverse());
		};

		fetcher();

		setLoading(false);
	}, [reportingAddress]);

	return (
		<>
			<Head>
				<title>Frankencoin - Reports</title>
			</Head>

			<AppTitle title={`Reports... `}></AppTitle>

			<AppCard>
				<div className={`grid md:grid-cols-2 m-4`}>
					<div>
						<div className="text-text-secondary">
							The Frankencoin ... a tool designed to keep users informed about various activities and updates ...
						</div>

						<div className="grid grid-cols-1 w-full my-4 md:ml-6 max-md:ml-2">
							<ul className="flex flex-col gap-4">
								<li className="flex justify-left items-center">
									<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-card-body-secondary" />
									<span className="ml-5 text-center">Position Costs</span>
								</li>
								<li className="flex justify-left items-center">
									<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-card-body-secondary" />
									<span className="ml-5 text-center">Savings Module</span>
								</li>
								<li className="flex justify-left items-center">
									<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-card-body-secondary" />
									<span className="ml-5 text-center">FPS Holder Earnings</span>
								</li>
							</ul>
						</div>
					</div>

					<div>
						<div className="text-text-secondary mb-4">
							The Frankencoin ... a tool designed to keep users informed about various activities and updates ...
						</div>

						<AddressInput
							label="Reporting Address"
							value={reportingAddress}
							onChange={setReportingAddress}
							disabled={isLoading}
						/>
					</div>
				</div>
			</AppCard>

			<AppTitle title="Position Costs" />
			<ReportsPositionsYearlyTable address={reportingAddress as Address} ownerPositionFees={ownerPositionFees} />

			<AppTitle title="Savings Yearly Earnings" />
			<ReportsSavingsYearlyTable save={savings.save} interest={savings.interest} withdraw={savings.withdraw} />

			<AppTitle title="FPS Holder Earnings" />
			<ReportsFPSYearlyTable address={reportingAddress as Address} fpsHistory={fpsHistory} fpsEarnings={fpsEarnings} />
		</>
	);
}
