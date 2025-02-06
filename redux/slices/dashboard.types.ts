import { AnalyticsDailyLog, ApiDailyLog, ApiTransactionLog } from "@frankencoin/api";
import { Address } from "viem";

// --------------------------------------------------------------------------------
export type DashboardState = {
	error: string | null;
	loaded: boolean;
	dailyLog: ApiDailyLog;
	txLog: ApiTransactionLog;
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};

export type DispatchApiDailyLog = {
	type: string;
	payload: ApiDailyLog;
};

export type DispatchApiTransactionLog = {
	type: string;
	payload: ApiTransactionLog;
};
