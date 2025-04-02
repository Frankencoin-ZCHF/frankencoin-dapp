import Head from "next/head";
import { useAccount } from "wagmi";
import AppTitle from "@components/AppTitle";
import AddressInput from "@components/Input/AddressInput";
import { useEffect, useState } from "react";
import AppCard from "@components/AppCard";
import { Address, isAddress } from "viem";
import { CONFIG, FRANKENCOIN_API_CLIENT } from "../app.config";
import { ApiSavingsUserTable } from "@frankencoin/api";
import ReportsSavingsYearlyTable from "@components/PageReports/ReportsSavingsYearlyTable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FPSBalanceHistory } from "../hooks/FPSBalanceHistory";
import { FPSEarningsHistory } from "../hooks/FPSEarningsHistory";
import ReportsFPSYearlyTable from "@components/PageReports/ReportsFPSYearlyTable";
import ReportsPositionsYearlyTable from "@components/PageReports/ReportsPositionsYearlyTable";
import { useRef } from "react";
import generatePDF, { Margin } from "react-to-pdf";
import AppLink from "@components/AppLink";
import { useContractUrl } from "@hooks";
import { useRouter } from "next/router";
import QRCode from "react-qr-code";

export type OwnerPositionFees = {
	t: number;
	f: bigint;
};

export default function ReportsPage() {
	const targetRef = useRef<HTMLDivElement>(null); // for pdf print
	const { address } = useAccount();
	const [isLoading, setLoading] = useState<boolean>(false);
	const [reportingAddress, setReportingAddress] = useState<string>(address ?? "");
	const [error, setError] = useState<string>("");
	const [ownerPositionFees, setOwnerPositionFees] = useState<OwnerPositionFees[]>([]);
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
				const responseOwnerPosition = await FRANKENCOIN_API_CLIENT.get(`/positions/mintingupdates/owner/${reportingAddress}/fees`);
				setOwnerPositionFees((responseOwnerPosition.data as { t: number; f: string }[]).map((i) => ({ t: i.t, f: BigInt(i.f) })));

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

	const handlePDFCreation = () => {
		generatePDF(targetRef, {
			filename: `FrankencoinReport-${reportingAddress}.pdf`,
			page: {
				margin: Margin.LARGE,
			},
		});
	};

	return (
		<div className="grid gap-8">
			<Head>
				<title>Frankencoin - Reports</title>
			</Head>

			<AppTitle title={`Reports `}>
				<div className="text-text-secondary">
					The Frankencoin Reports page lets you track ZCHF finances for a specific address, perfect for tax purposes or yearly
					summaries.
				</div>
			</AppTitle>

			<AppCard>
				<div className={`grid md:grid-cols-2 m-4`}>
					<div>
						<div className="grid grid-cols-1 w-full my-4 md:ml-6 max-md:ml-2">
							<ul className="flex flex-col gap-4">
								<li className="flex justify-left items-center">
									<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-card-body-secondary" />
									<span className="ml-5 text-center">Positions Costs</span>
								</li>
								<li className="flex justify-left items-center">
									<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-card-body-secondary" />
									<span className="ml-5 text-center">Savings Earnings</span>
								</li>
								<li className="flex justify-left items-center">
									<FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-card-body-secondary" />
									<span className="ml-5 text-center">FPS Holder Earnings</span>
								</li>
							</ul>
						</div>
					</div>

					<div className="mt-4">
						<div className="text-text-secondary mb-4">
							Enter any address to View or{" "}
							<span className="text-card-input-min hover:text-card-input-hover cursor-pointer" onClick={handlePDFCreation}>
								Download
							</span>{" "}
							the report.
						</div>

						<AddressInput
							label="Reporting Address"
							value={reportingAddress}
							onChange={setReportingAddress}
							disabled={isLoading}
							error={error}
						/>
					</div>
				</div>
			</AppCard>

			<hr className="my-12 h-0.5 border-t-0 bg-text-secondary" />

			<div className="grid gap-8 relative min-h-[100%] pb-24" ref={targetRef}>
				<AppTitle title={`Report `}>
					<div className="text-text-secondary">
						<div className="mb-4">This report provides a summary of Frankencoin ZCHF financial activities for:</div>
						<AppLink className="text-sm" label={reportingAddress} href={useContractUrl(reportingAddress)} external={true} />
					</div>
				</AppTitle>

				<AppTitle title="Positions Costs" />
				<ReportsPositionsYearlyTable address={reportingAddress as Address} ownerPositionFees={ownerPositionFees} />

				<AppTitle title="Savings Yearly Earnings" />
				<ReportsSavingsYearlyTable save={savings.save} interest={savings.interest} withdraw={savings.withdraw} />

				<AppTitle title="FPS Holder Earnings" />
				<ReportsFPSYearlyTable address={reportingAddress as Address} fpsHistory={fpsHistory} fpsEarnings={fpsEarnings} />

				<div className="grid md:grid-cols-2 mt-auto pt-24">
					<div className="relative">
						<div className="absolute bottom-8 w-full flex justify-center">
							<picture>
								<img src="/assets/frankencoin_logo.svg" alt="logo" className="h-20" />
							</picture>
						</div>
					</div>

					<div className="flex flex-col items-center justify-center">
						<QRCode size={256} value={`${CONFIG.app}/reports?address=${reportingAddress}`} bgColor="transparent" />

						<div className="text-xl my-2">
							<div>Scan to View Online</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
