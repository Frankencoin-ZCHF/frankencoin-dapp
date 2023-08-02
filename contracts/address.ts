import { hardhat, mainnet } from "wagmi/chains";

export const Address: Record<number, any> = {
  [hardhat.id]: {
    frankenCoin: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    bridge: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    xchf: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    equity: '0xCafac3dD18aC6c6e92c921884f9E4176737C052c',
    mintingHub: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  },
  [mainnet.id]: {
    frankenCoin: '0x7a787023f6E18f979B143C79885323a24709B0d8',
    bridge: '0x4125cD1F826099A4DEaD6b7746F7F28B30d8402B',
    xchf: '0xb4272071ecadd69d933adcd19ca99fe80664fc08',
    equity: '0x34620625DFfCeBB199331B8599829426a46fd123',
    mintingHub: '0x0E5Dfe570E5637f7b6B43f515b30dD08FBFCb9ea',
  }
}