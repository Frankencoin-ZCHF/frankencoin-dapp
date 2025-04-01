import { MARKETING_PARAM_NAME } from "./constant";
import { pad, stringToHex, hexToString } from "viem";


export const getReferralLink = (referralName: string) => {
    return `${window.location.origin}?${MARKETING_PARAM_NAME}=${referralName}`;
}   

export const getFrontendCodeFromReferralName = (referralName: string) => {
    return pad(stringToHex(referralName), { size: 32 });
} 

export const getReferralNameFromFrontendCode = (frontendCode: `0x${string}`) => {
    const decoded = hexToString(frontendCode).toString().replace(/\0/g, '');
    return /^[\x20-\x7E]*$/.test(decoded) ? decoded : '';
}