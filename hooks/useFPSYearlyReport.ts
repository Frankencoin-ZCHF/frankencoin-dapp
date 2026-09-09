import { useEffect, useState } from "react";
import { Address } from "viem";
import { ApiFpsYearlyRow, ReportingToken } from "@frankencoin/api";
import { FRANKENCOIN_API_CLIENT } from "../app.config";

export const useFPSYearlyReport = (address: Address, token: ReportingToken = "combined"): ApiFpsYearlyRow[] => {
	const [rows, setRows] = useState<ApiFpsYearlyRow[]>([]);

	useEffect(() => {
		let cancelled = false;

		FRANKENCOIN_API_CLIENT.get(`/reporting/fps/yearly`, { params: { address, token } })
			.then((response) => {
				if (cancelled) return;
				const data = response.data;
				setRows(Array.isArray(data) ? (data as ApiFpsYearlyRow[]) : []);
			})
			.catch((error) => {
				console.error("Failed to fetch FPS yearly report", error);
			});

		return () => {
			cancelled = true;
		};
	}, [address, token]);

	return rows;
};
