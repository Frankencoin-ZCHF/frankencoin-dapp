import { AnalyticsDailyLog, ApiDailyLog } from "@frankencoin/api";
import { Address } from "viem";

// --------------------------------------------------------------------------------
export type DashboardState = {
	error: string | null;
	loaded: boolean;
	dailyLog: ApiDailyLog;
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
