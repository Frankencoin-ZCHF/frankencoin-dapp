import { Address } from 'viem';

// --------------------------------------------------------------------------------
export type AccountState = {
	error: string | null;
	loading: boolean;
};

// --------------------------------------------------------------------------------
export type DispatchBoolean = {
	type: string;
	payload: Boolean;
};
