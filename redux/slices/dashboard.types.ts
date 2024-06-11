import { Address } from "viem";

// --------------------------------------------------------------------------------
export type DashboardState = {
	error: string | null;
	loaded: boolean;
	tabs: {
		positionsTab: string;
		positionTab: string;
	};
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};
