import { Address } from "viem";
import { hardhat, mainnet, sepolia } from "wagmi/chains";

export interface ProtocolAddress {
  frankenCoin: Address;
  bridge: Address;
  xchf: Address;
  equity: Address;
  mintingHub: Address;
  mockVol?: Address;
  positionFactory?: Address;
}

export const ADDRESS: Record<number, ProtocolAddress> = {
  [hardhat.id]: {
    frankenCoin: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    bridge: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    xchf: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    equity: "0xCafac3dD18aC6c6e92c921884f9E4176737C052c",
    mintingHub: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    mockVol: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  },
  [sepolia.id]: {
    frankenCoin: "0x28c4efd564103730160ad1E6A241b30808445363",
    bridge: "0x1Fc726149c6d6CC16C5f23cD9ec004a501D06012",
    xchf: "0xe94c49Dcf0c7D761c173E9C131B132A1Cfb81A80",
    equity: "0x22f3b4CEED90207620C5631b748f65f805bc774f",
    mintingHub: "0x6f43400A93c222666351c05A4e36Ec6A51a5b49B",
    mockVol: "0x37935cedc62b3ec5decc0a9776ee4fee37965ca3",
    positionFactory: "0x6ad579D11349d70704df66bc78f84Ae5BBce8D4A",
  },
  [mainnet.id]: {
    frankenCoin: "0xB58E61C3098d85632Df34EecfB899A1Ed80921cB",
    bridge: "0x7bbe8F18040aF0032f4C2435E7a76db6F1E346DF",
    xchf: "0xb4272071ecadd69d933adcd19ca99fe80664fc08",
    equity: "0x1bA26788dfDe592fec8bcB0Eaff472a42BE341B2",
    mintingHub: "0x7546762fdb1a6d9146b33960545C3f6394265219",
  },
};
