import { ERC20Info, ApiPriceERC20 } from "@deuro/api";

export type ReferralsState = {
  error: string | null;
  loaded: boolean;
  myReferralName: string;
  myReferralCount: number; 
  myTotalRewards: string;
  myReferralLink: string;
  myFrontendCode: `0x${string}` | null;
};

export type DispatchString = {
  type: string;
  payload: string;
};

export type DispatchBoolean = {
  type: string;
  payload: boolean;
};

export type DispatchReferralsState = {
  type: string;
  payload: Partial<ReferralsState>;
};

export type DispatchFrontendCode = {
  type: string;
  payload: `0x${string}` | null;
};
