import { Address } from "viem";
import { hardhat, mainnet, sepolia } from "wagmi/chains";

export interface ProtocolAddress {
  frankenCoin: Address
  bridge: Address
  xchf: Address
  equity: Address
  mintingHub: Address
}

export const ADDRESS: Record<number, ProtocolAddress> = {
  [hardhat.id]: {
    frankenCoin: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    bridge: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    xchf: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    equity: '0xCafac3dD18aC6c6e92c921884f9E4176737C052c',
    mintingHub: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  },
  [sepolia.id]: {
    frankenCoin: '0xB19373305306DeE3156e0916bB1ed07aafcc345c',
    // Mock VOl Token: '0x37935cedc62b3ec5decc0a9776ee4fee37965ca3',
    // Position Factory: '0x6C36Ea4bF1F9E9D12631Fa80066bFd62065fE834',
    bridge: '0xF798C674c636657bede42c7f71F6939e0d25E680',
    xchf: '0xCf3f8985e8aA051C15ED7baBCeEAc9aaD6711a85',
    equity: '0x51571e6d031174f6C17232A7061b9025666FC244',
    mintingHub: '0xE3Ce8d8ed0D513f6732e237E3DfDCa8D29156C46',
  },
  [mainnet.id]: {
    frankenCoin: '0x7a787023f6E18f979B143C79885323a24709B0d8',
    bridge: '0x4125cD1F826099A4DEaD6b7746F7F28B30d8402B',
    xchf: '0xb4272071ecadd69d933adcd19ca99fe80664fc08',
    equity: '0x34620625DFfCeBB199331B8599829426a46fd123',
    mintingHub: '0x0E5Dfe570E5637f7b6B43f515b30dD08FBFCb9ea',
  }
}