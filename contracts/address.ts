import { zeroAddress } from "viem";
import { Address } from "viem/accounts";
import { arbitrum, hardhat, mainnet, optimism, polygon, sepolia } from "wagmi/chains";
import { ethereum3 } from "./chains";

export interface ProtocolAddress {
	frankenCoin: Address;
	bridge: Address;
	xchf: Address;
	equity: Address;
	mintingHub: Address;
	wFPS: Address;

	bridgePolygonFrankencoin?: Address;
	bridgePolygonWfps?: Address;
	bridgeArbitrumFrankencoin?: Address;
	bridgeArbitrumWfps?: Address;
	bridgeOptimismFrankencoin?: Address;
	bridgeOptimismWfps?: Address;

	fpsUnlock?: Address;

	// accept any key
	[key: string]: Address | undefined;
}

export const ADDRESS: Record<number, ProtocolAddress> = {
	[hardhat.id]: {
		frankenCoin: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
		bridge: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
		xchf: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
		equity: "0xCafac3dD18aC6c6e92c921884f9E4176737C052c",
		mintingHub: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
		mockVol: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
		wFPS: zeroAddress,
	},
	[sepolia.id]: {
		frankenCoin: "0x28c4efd564103730160ad1E6A241b30808445363",
		bridge: "0x1Fc726149c6d6CC16C5f23cD9ec004a501D06012",
		xchf: "0xe94c49Dcf0c7D761c173E9C131B132A1Cfb81A80",
		equity: "0x22f3b4CEED90207620C5631b748f65f805bc774f",
		mintingHub: "0x6f43400A93c222666351c05A4e36Ec6A51a5b49B",
		positionFactory: "0x6ad579D11349d70704df66bc78f84Ae5BBce8D4A",
		wFPS: zeroAddress,
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
		mockPns: "0xA6F0130d359928AE8A9e0F3C919046a309F4e1a8",
		mockVeda: "0x0f0c2337A02AeBe1caE2AC34FDaDF067ef5C1277",
		mockFsags: "0xbB70FC012D6a060Bb66cab828132754ec7915274",
		mockSpos: "0xC2448aC7A2eb098B241E394B89ECf634aA7EA845",
		mockEhck: "0x28a881B08c11a5856C971dbE52f03f1848A13016",
		mockFdos: "0x9020a8f194E413900A304631c71BA1f335322A82",
		mockDilys: "0x9e575060f9E78C2Dd6aEE5d6E3449E06C300e4f6",
		mockNnmls: "0x36b18FCA7C19D1A8a523Db31f15c5482E3697537",
		mockTsqp: "0x2C368ec51691a54c964201b0325ff6AC37EF5403",
		mockXxs: "0xe8992E66451A60d0A524226514E7B43A2E920701",
		mockFors: "0x1878743c481b2e4bfe9A423dc8F983C7ed364bF2",
		mockShrs: "0xFEb3c07C4Ef56D938A0eae401FA37C0618e91b32",
		mockSuns: "0xd2B5d3E0fF43b42e2b53C94995a9471d72a83D8d",
		mockHps: "0x7319A8c28905530DFEF2354b5293Baae209D31d4",
		mockRxus: "0xCF3249d9FD12D566eB1B59C173A1346DC66712E7",
		mockWmkt: "0xEF16CD43Bd53E74547743d2b2279B73564fAaa30",
		mockFes: "0xec4aEea6C825F044CFfB077F9E56a75441c92EC4",
		mockDdcs: "0x96a7D58eCaE2462eAbB5f1bAE31Eb6BE4beaddf1",
		mockLines: "0x0d9a2e156E45628C16F8f94e1E488B62F611A94b",
		mockDkkb: "0xAA115D40D67883a58A1e05d8FB1153473b9b087d",
	},
	[mainnet.id]: {
		frankenCoin: "0xB58E61C3098d85632Df34EecfB899A1Ed80921cB",
		bridge: "0x7bbe8F18040aF0032f4C2435E7a76db6F1E346DF",
		xchf: "0xb4272071ecadd69d933adcd19ca99fe80664fc08",
		equity: "0x1bA26788dfDe592fec8bcB0Eaff472a42BE341B2",
		mintingHub: "0x7546762fdb1a6d9146b33960545C3f6394265219",
		wFPS: "0x5052D3Cc819f53116641e89b96Ff4cD1EE80B182",

		// utils
		fpsUnlock: zeroAddress,

		bridgePolygonFrankencoin: "0x02567e4b14b25549331fCEe2B56c647A8bAB16FD",
		bridgeArbitrumFrankencoin: "0xB33c4255938de7A6ec1200d397B2b2F329397F9B",
		bridgeOptimismFrankencoin: "0x4F8a84C442F9675610c680990EdDb2CCDDB8aB6f",
		bridgePolygonWfps: "0x54Cc50D5CC4914F0c5DA8b0581938dC590d29b3D",
		bridgeArbitrumWfps: zeroAddress,
		bridgeOptimismWfps: zeroAddress,
	},
	[polygon.id]: {
		// For testing purposes only, (deployed on polygon mainnet)
		frankenCoin: "0xAFAA1F380957072762b80dc9036c451bcd6e774f",
		bridge: zeroAddress,
		xchf: zeroAddress,
		equity: "0x9f40894a2E47305DE4C79b53B48B7a57805065eA",
		mintingHub: "0xa3039043B2C5a74A39b139e389b7591Ab76d20d1",
		wFPS: "0xA006454C97Ee457F48acc107cFF9Ba0438d0e785",

		// utils
		fpsUnlock: "0xA006454C97Ee457F48acc107cFF9Ba0438d0e785", // FIXME: replace addr

		// bridges to mainnet (real frankencoin)
		bridgePolygonFrankencoin: "0x02567e4b14b25549331fCEe2B56c647A8bAB16FD",
		bridgePolygonWfps: "0x54Cc50D5CC4914F0c5DA8b0581938dC590d29b3D",
	},
	[arbitrum.id]: {
		frankenCoin: zeroAddress,
		bridge: zeroAddress,
		xchf: zeroAddress,
		equity: zeroAddress,
		mintingHub: zeroAddress,
		wFPS: zeroAddress,

		bridgeArbitrumFrankencoin: "0xB33c4255938de7A6ec1200d397B2b2F329397F9B",
	},
	[optimism.id]: {
		frankenCoin: zeroAddress,
		bridge: zeroAddress,
		xchf: zeroAddress,
		equity: zeroAddress,
		mintingHub: zeroAddress,
		wFPS: zeroAddress,

		bridgeOptimismFrankencoin: "0x4F8a84C442F9675610c680990EdDb2CCDDB8aB6f",
	},
	[ethereum3.id]: {
		frankenCoin: "0x9800f06718bB6F7FCAC181ED26753E2E670cb9e0",
		bridge: zeroAddress,
		xchf: zeroAddress,
		equity: "0x97e3bbF39138B1e7E1d06dd26E7E3b9d558b00b2",
		mintingHub: "0xA0d6ce30a8a4eab09eD74f434dcA4Ce4169aDd03",
		wFPS: zeroAddress,
	},
};

export const TokenAddresses = {
	ZCHF: "0xB58E61C3098d85632Df34EecfB899A1Ed80921cB",
	BOSS: "0x2E880962A9609aA3eab4DEF919FE9E917E99073B",
	LsETH: "0x8c1BEd5b9a0928467c9B1341Da1D7BD5e10b6549",
	WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
	REALU: "0x553C7f9C780316FC1D34b8e14ac2465Ab22a090B",
	XCHF: "0xB4272071eCAdd69d933AdcD19cA99fe80664fc08",
};
