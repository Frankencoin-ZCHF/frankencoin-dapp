import { Address } from "viem";

// CCIPWrapper (CCIPReceiver) on Optimism — deposits received ZCHF into svZCHF on behalf of the
// recipient encoded in the CCIP message data. Not deployed yet; replace once live.
export const CCIP_WRAPPER_OPTIMISM: Address = "0x0000000000000000000000000000000000000000";

export const CCIP_SEND_GAS_LIMIT = 500_000n;
