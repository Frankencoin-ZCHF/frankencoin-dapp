import { Address } from "wagmi";
import { hardhat, mainnet, sepolia } from "wagmi/chains";

export interface ProtocolAddress {
  frankenCoin: Address;
  bridge: Address;
  xchf: Address;
  equity: Address;
  mintingHub: Address;
  positionFactory?: Address;
  mockVol?: Address;
  mockVids?: Address;
  mockBoss?: Address;
  mockRealu?: Address;
  mockTbos?: Address;
  mockAxelra?: Address;
  mockCas?: Address;
  mockDaks?: Address;
  mockDqts?: Address;
  mockAfs?: Address;
  mockArts?: Address;
  mockVrgns?: Address;
  mockEggs?: Address;
  mockPds?: Address;
  mockVegs?: Address;
  mockCfes?: Address;
  mockGmcs?: Address;
  mockBees?: Address;
  mockDgcs?: Address;
  mockCias?: Address;
  mockFnls?: Address;
  mockTvpls?: Address;
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
    positionFactory: "0x6ad579D11349d70704df66bc78f84Ae5BBce8D4A",
    mockVids: "0xbe374758Eca03653ACdB43D91461e3c35669acB4",
    mockBoss: "0x08c03ec7cE1747f01A54f9e79DDdc928b1932f61",
    mockRealu: "0x0F89a805dFcdE077C400f320a74E61bFC2D2e98E",
    mockTbos: "0x7F77405c0B288f9B84C8fDbAff42D5b5c917d3D7",
    mockAxelra: "0x59dAcD3b9f5a4808F5057041f7eDC97a793152f4",
    mockCas: "0x611F02D44ECBe9F552D4b654D222A9AaEc17Dcb6",
    mockDaks: "0xd07834f7A348bC78D66994a64ECDD67030b65BA8",
    mockDqts: "0xD058cBC8d552ED3d66EF7CD602371f348af2E0c7",
    mockAfs: "0xA2fc0b6893553bfEc4a2bf016593FF62f2d2Be7C",
    mockArts: "0xD739cf0619196c456Fa7329140700DC1A737ef02",
    mockVrgns: "0x4572Fdde0e84c5DF4F2C4F2e6a3eA67C816C6A04",
    mockEggs: "0x61f50615064cCA97fFbA4436449987C20b848275",
    mockPds: "0xB40b7095b499f3789a6aa25320e14227D4D959F2",
    mockVegs: "0xBf1eD3b00C3B33a58CA245563EC9139A34a8F446",
    mockCfes: "0x9e601D329d1AfB4D325A1Ac09Fe26C76b4d6b5A1",
    mockGmcs: "0x1Be64F88b4Ed8828e19368F3544e53D944834EEB",
    mockBees: "0x5AadE3c5570E7C3169b991174130589a761BCc47",
    mockDgcs: "0xea89Ab2F84Acc7Cd6a82772cD61995A24314FbB6",
    mockCias: "0x3616bbA2BCE749Ba1f30e492042E4Bd6584c3c1d",
    mockFnls: "0xe1D9f96620B2f91d3360D02b9d5a271181DeB1B7",
    mockTvpls: "0x8b2A6ca85d4a58497D6D2Cc24Aea64a88FdACD85",
  },
  [mainnet.id]: {
    frankenCoin: "0xB58E61C3098d85632Df34EecfB899A1Ed80921cB",
    bridge: "0x7bbe8F18040aF0032f4C2435E7a76db6F1E346DF",
    xchf: "0xb4272071ecadd69d933adcd19ca99fe80664fc08",
    equity: "0x1bA26788dfDe592fec8bcB0Eaff472a42BE341B2",
    mintingHub: "0x7546762fdb1a6d9146b33960545C3f6394265219",
  },
};
