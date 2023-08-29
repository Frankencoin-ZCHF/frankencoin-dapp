import { Address } from "viem";
import { hardhat, mainnet, sepolia } from "wagmi/chains";

export interface ProtocolAddress {
  frankenCoin: Address;
  bridge: Address;
  xchf: Address;
  equity: Address;
  mintingHub: Address;
  mockVol?: Address;
}

export const ADDRESS: Record<number, ProtocolAddress> = {
  [hardhat.id]: {
    frankenCoin: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    bridge: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    xchf: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    equity: "0xCafac3dD18aC6c6e92c921884f9E4176737C052c",
    mintingHub: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  },
  [sepolia.id]: {
    frankenCoin: "0x304B992EFb5d140393542D072e52279A43a6EA75",
    mockVol: "0x37935cedc62b3ec5decc0a9776ee4fee37965ca3",
    // Position Factory: '0x87a81A66F1716A971e1513bF2fAc7572b06bc8DD',
    bridge: "0x3f41Bc2895C6Ad65b1855753870F8847947Fa0B1",
    xchf: "0xCf3f8985e8aA051C15ED7baBCeEAc9aaD6711a85",
    equity: "0x913de60b32CEE74f15cB0127F8954F7ED79Eb043",
    mintingHub: "0x4F55268895aa588557Dc3D1421Fc79068dC5537F",
  },
  [mainnet.id]: {
    frankenCoin: "0x7a787023f6E18f979B143C79885323a24709B0d8",
    bridge: "0x4125cD1F826099A4DEaD6b7746F7F28B30d8402B",
    xchf: "0xb4272071ecadd69d933adcd19ca99fe80664fc08",
    equity: "0x34620625DFfCeBB199331B8599829426a46fd123",
    mintingHub: "0x0E5Dfe570E5637f7b6B43f515b30dD08FBFCb9ea",
  },
};
