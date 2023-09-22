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
    frankenCoin: "0xb8C70553165e197f20a0ceC3dbab439c970f816f",
    bridge: "0x7DfBc328c817127197F02B0Fe0F2925aDf977d64",
    xchf: "0xe94c49Dcf0c7D761c173E9C131B132A1Cfb81A80",
    equity: "0x6bdD098E2316F4c57dd1c9a8CcA22506f8e523D8",
    mintingHub: "0x41Cd0881BBeD2ef1f6b4f369aAA7C25D34eF0688",
    mockVol: "0x37935cedc62b3ec5decc0a9776ee4fee37965ca3",
    positionFactory: "0x895eaA01CaFe0985B5A90728d0395DA41CDA77Ba",
  },
  [mainnet.id]: {
    frankenCoin: "0x7a787023f6E18f979B143C79885323a24709B0d8",
    bridge: "0x4125cD1F826099A4DEaD6b7746F7F28B30d8402B",
    xchf: "0xb4272071ecadd69d933adcd19ca99fe80664fc08",
    equity: "0x34620625DFfCeBB199331B8599829426a46fd123",
    mintingHub: "0x0E5Dfe570E5637f7b6B43f515b30dD08FBFCb9ea",
  },
};
