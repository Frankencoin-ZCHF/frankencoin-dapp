import { MARKETING_PARAM_NAME } from "./constant";
import { pad, stringToHex, hexToString, Hex } from "viem";


export const getReferralLink = (referralName: string) => {
    return `${window.location.origin}?${MARKETING_PARAM_NAME}=${referralName}`;
}   

export const getFrontendCodeFromReferralName = (referralName: string) => {
    return pad(stringToHex(referralName), { size: 32 });
} 

export const getReferralNameFromFrontendCode = (frontendCode: `0x${string}`) => {
    if (frontendCode?.startsWith('0x00')) {
		return hexToString(frontendCode as Hex).replace(/\0/g, '');
	}
    return '';
}