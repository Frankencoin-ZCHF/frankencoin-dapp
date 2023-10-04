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
    frankenCoin: "0x73aDCc946149c273fB6db938C20CA42270c5C623",
    bridge: "0x56FD5AA538bA14a61D4B9C703C1362627902767E",
    xchf: "0xe94c49Dcf0c7D761c173E9C131B132A1Cfb81A80",
    equity: "0x3b17A15B4e1093F75309E5f3829796817350B7AA",
    mintingHub: "0x12003fD56802dE26cAE698A9d9cb06921c053e83",
    mockVol: "0x37935cedc62b3ec5decc0a9776ee4fee37965ca3",
    positionFactory: "0xACC9b9640F5568D85E9392ac823491D3E5029430",
  },
  [mainnet.id]: {
    frankenCoin: "0x7a787023f6E18f979B143C79885323a24709B0d8",
    bridge: "0x4125cD1F826099A4DEaD6b7746F7F28B30d8402B",
    xchf: "0xb4272071ecadd69d933adcd19ca99fe80664fc08",
    equity: "0x34620625DFfCeBB199331B8599829426a46fd123",
    mintingHub: "0x0E5Dfe570E5637f7b6B43f515b30dD08FBFCb9ea",
  },
};
