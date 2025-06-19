import Head from "next/head";
import { useAccount } from "wagmi";
import AppTitle from "@components/AppTitle";
import AddressInput from "@components/Input/AddressInput";
import { useEffect, useState } from "react";
import AppCard from "@components/AppCard";
import { Address, isAddress } from "viem";
import { FRANKENCOIN_API_CLIENT } from "../app.config";
import { ApiSavingsUserTable } from "@frankencoin/api";
import ReportsSavingsYearlyTable from "@components/PageReports/ReportsSavingsYearlyTable";
import { FPSBalanceHistory } from "../hooks/FPSBalanceHistory";
import { FPSEarningsHistory } from "../hooks/FPSEarningsHistory";
import ReportsFPSYearlyTable from "@components/PageReports/ReportsFPSYearlyTable";
import ReportsPositionsYearlyTable from "@components/PageReports/ReportsPositionsYearlyTable";
import { useRef } from "react";
import generatePDF, { Margin } from "react-to-pdf";
import { useRouter } from "next/router";
import DateInput from "@components/Input/DateInput";

export type OwnerPositionFees = {
	t: number;
	f: bigint;
};

export type OwnerPositionDebt = {
	t: number;
	p: Address;
	m: bigint;
	r: bigint;
};

export default function ReportPage() {
	const targetRef = useRef<HTMLDivElement>(null); // for pdf print
	const { address } = useAccount();
	const [isLoading, setLoading] = useState<boolean>(false);
	const [isExporting, setExporting] = useState<boolean>(false);
	const [reportingAddress, setReportingAddress] = useState<string>(address ?? "");
	const [error, setError] = useState<string>("");
	const [ownerPositionFees, setOwnerPositionFees] = useState<OwnerPositionFees[]>([]);
	const [ownerPositionDebt, setOwnerPositionDebt] = useState<OwnerPositionDebt[]>([]);
	const [savings, setSavings] = useState<ApiSavingsUserTable>({ save: [], interest: [], withdraw: [] });
	const [fpsHistory, setFpsHistory] = useState<FPSBalanceHistory[]>([]);
	const [fpsEarnings, setFpsEarnings] = useState<FPSEarningsHistory[]>([]);

	const router = useRouter();
	const overwrite: Address = router.query.address as Address;

	useEffect(() => {
		if (overwrite == undefined || overwrite.length == 0) return;
		if (isAddress(overwrite)) {
			setReportingAddress(overwrite);
		}
	}, [overwrite]);

	useEffect(() => {
		if (reportingAddress == "") {
			setError("");
			return;
		}

		if (!isAddress(reportingAddress)) {
			setOwnerPositionFees([]);
			setSavings({ save: [], interest: [], withdraw: [] });
			setFpsHistory([]);
			setFpsEarnings([]);
			setError("Invalid Address");
			return;
		}

		setLoading(true);
		const fetcher = async () => {
			try {
				const responsePositionsFees = await FRANKENCOIN_API_CLIENT.get(`/positions/mintingupdates/owner/${reportingAddress}/fees`);
				setOwnerPositionFees((responsePositionsFees.data as { t: number; f: string }[]).map((i) => ({ t: i.t, f: BigInt(i.f) })));

				const responsePositionsDebt = await FRANKENCOIN_API_CLIENT.get(`/positions/mintingupdates/owner/${reportingAddress}/debt`);
				const debt = responsePositionsDebt.data as {
					[key: string]: { [key: Address]: { t: number; p: Address; m: string; r: number }[] };
				};

				const yearly: OwnerPositionDebt[] = Object.keys(debt)
					.map((y) => Object.values(debt[y]).flat())
					.flat()
					.map((i) => ({ ...i, m: BigInt(i.m), r: BigInt(i.r) }));

				setOwnerPositionDebt(yearly);

				const responseSavings = await FRANKENCOIN_API_CLIENT.get(`/savings/core/user/${reportingAddress}`);
				setSavings(responseSavings.data as ApiSavingsUserTable);

				const responseBalance = await FPSBalanceHistory(reportingAddress);
				setFpsHistory(responseBalance.reverse());

				const responseEarnings = await FPSEarningsHistory(reportingAddress);
				setFpsEarnings(responseEarnings.reverse());

				// clear all errors
				setError("");
			} catch (error) {
				if (typeof error == "string") {
					setError(error);
				} else {
					setError("Something did not work correctly");
				}
			}
		};

		fetcher();
		setLoading(false);
	}, [reportingAddress]);

	useEffect(() => {
		if (!isExporting) return;

		generatePDF(targetRef, {
			filename: `FrankencoinReport-${reportingAddress}.pdf`,
			page: {
				margin: Margin.LARGE,
				format: "A4",
				orientation: "portrait",
			},
		});

		setExporting(false);
	}, [isExporting, reportingAddress]);

	const handlePDFCreation = () => {
		setExporting(true);
	};

	return (
		<div className={`grid gap-8 ${isExporting ? "w-[60rem]" : ""}`} ref={targetRef}>
			<Head>
				<title>Frankencoin - Report</title>
			</Head>

			<AppTitle title={`Frankencoin Wealth and Income Report`}>
				<div className="text-text-secondary">
					Track the yearly wealth, income, debt, and costs attributable to a given address. For the current year, the values
					reflect the accrued amounts up to the current date. All data is provided on a &apos;best effort&apos; basis without any
					guarantee of accuracy. The contents of this page are also available as{" "}
					<span className="text-card-input-min hover:text-card-input-hover cursor-pointer" onClick={handlePDFCreation}>
						pdf download
					</span>
					.
				</div>
			</AppTitle>

			<AppCard>
				<div className="grid md:gap-8 md:grid-cols-3 items-center -mb-4">
					<DateInput className="" label="Current Date" value={new Date()} disabled={true} />

					<AddressInput
						className="col-span-2"
						label="Address of Interest"
						value={reportingAddress}
						onChange={setReportingAddress}
						disabled={isLoading}
						error={error}
					/>
				</div>
			</AppCard>

			<AppTitle title="Collateralized Debt Positions">
				<div className="text-text-secondary">Open positions at the end of each year as well as interest paid.</div>
			</AppTitle>
			<ReportsPositionsYearlyTable
				address={reportingAddress as Address}
				ownerPositionFees={ownerPositionFees}
				ownerPositionDebt={ownerPositionDebt}
			/>
			<div className="text-text-secondary text-sm -mt-7">
				Note: &apos;Ownership transfer&apos; events are not tracked. If a position&apos;s ownership changes, the outstanding debt
				may not be accurately deducted from the previous owner or reflected correctly in this table. Additionally, interest payments
				are recorded in the year they are made, even if they cover interest accrued in a different period.
			</div>

			<AppTitle title="Savings">
				<div className="text-text-secondary">Interest collected for each period as well as the year end balances.</div>
			</AppTitle>
			<ReportsSavingsYearlyTable save={savings.save} interest={savings.interest} withdraw={savings.withdraw} />

			<AppTitle title="Equity Participation">
				<div className="text-text-secondary">
					Attributable income for each year, as well as the balance and its value at the end of the year. Attributable income is
					the sum of all income and loss events, weighted by the held FPS tokens relative to the total supply at each relevant
					point in time.
				</div>
			</AppTitle>
			<ReportsFPSYearlyTable address={reportingAddress as Address} fpsHistory={fpsHistory} fpsEarnings={fpsEarnings} />
		</div>
	);
}
