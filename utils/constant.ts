export const SOCIAL = {
	Github_organization: "https://github.com/d-EURO",
	Github_contract: "https://github.com/d-EURO/smartContracts",
	Github_dapp: "https://github.com/d-EURO/dapp",
	Github_dapp_new_issue: "https://github.com/d-EURO/dapp/issues/new/choose",
	Github_contract_discussion: "https://github.com/orgs/d-EURO/discussions",
	Telegram: "https://t.me/dEURO_DecentralizedEuro",
	TelegramApiBot: "https://t.me/dEuro_bot",
	Twitter: "https://x.com/dEURO_com",
	Forum: "https://github.com/d-EURO/smartContracts/discussions",
	Docs: "https://docs.deuro.com",
	Partner_DfxSwiss: "https://exchange.dfx.swiss/",
};

// Symbols for the tokens of the protocol
export const TOKEN_SYMBOL = "dEURO";

export const POOL_SHARE_TOKEN_SYMBOL = "DEPS";

export const NATIVE_POOL_SHARE_TOKEN_SYMBOL = "nDEPS";

// For managing frontend codes
export const MARKETING_PARAM_NAME = "ref";

export const DEFAULT_FRONTEND_CODE = "0xc155a9c8a3ce42a8268fb22f801479e378d5e70dbcc83db8604b296c6d1d3e10";

export const FRONTEND_CODES: { [key: string]: `0x${string}` } = {
	dEuro: "0xc155a9c8a3ce42a8268fb22f801479e378d5e70dbcc83db8604b296c6d1d3e10",
	Michael: "0xdc09f425cfb64bbb93a07bf22ea7e7922e24874971b6d17ce1f91750ad92ef62",
};

export const WHITELISTED_POSITIONS = [
	"0x489c40401d465A632297c5810b0E209059e71bE4", // LsETH
	"0x1F26fAAc7DCdBe356d21d12AEdE2C2fF3aCB044e", // WETH
	"0xDe084C54634Ce433e4216175d1f95aE3a62461A9", // WBTC
	"0x1cd8C2aA91327437c54595a987d347652AdCd102", // cbBTC
	"0x4aACB415158d5c4B0A51F1Ca37033D44CF00eF3b", // kBTC
	"0x4b57fcA0E11842E72cd6a6462e35B252235FC4eC", // USDC
	"0x34C70957536445b86471079AC69EB7EFb2ad2b82", // UNI
	"0x17DC34333f3d3AAF59bDc389769289176f8b58b3", // DAI
	"0x08Ef4f555DD84aCC3ba924686D08fd96810a6895", // XAUt
	"0x0Ecf0fB32ACf1eA85eb8020684a828e4C90d1D5d", // ZCHF
	"0xca428F192c20a48b23be1408c6fF12212746D866", // WFPS
];

export const INTERNAL_PROTOCOL_POSITIONS = ["0x391d2C7677e566EdE516a0780ddfBBb65a806914"];
