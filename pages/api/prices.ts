import type { NextApiRequest, NextApiResponse } from "next";
import { PriceQueryObjectArray, PriceQuery, PriceQueryCurrencies } from "../../redux/slices/prices.types";
import { COINGECKO_CLIENT, WAGMI_CHAIN } from "../../app.config";
import { Address } from "viem";
import { ERC20Info, PositionQuery } from "../../redux/slices/positions.types";
import { uniqueValues } from "../../utils/format-array";
import { fetchPositions } from "./positions";
import { ADDRESS } from "../../contracts/address";

// forced init caching of ERC20Infos
// solves development mode caching issue with coingecko free plan
let fetchedPositions: PositionQuery[] = [];
let fetchedAddresses: Address[] = [];
let fetchedERC20Infos: ERC20Info[] = [];
let fetchedPrices: PriceQueryObjectArray = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse<updateDetailsResponse>) {
	if (fetchedPositions.length == 0) await updateDetails();
	res.status(200).json({
		prices: fetchedPrices,
		addresses: fetchedAddresses,
		infos: fetchedERC20Infos,
	});
}

type updateDetailsResponse = {
	prices: PriceQueryObjectArray;
	addresses: Address[];
	infos: ERC20Info[];
};

export async function updateDetails(): Promise<updateDetailsResponse> {
	const tmp = await fetchPositions();
	if (tmp.length == 0)
		return {
			prices: fetchedPrices,
			addresses: fetchedAddresses,
			infos: fetchedERC20Infos,
		};
	fetchedPositions = tmp;

	const collateralAddresses = fetchedPositions.map((position) => position.collateral).filter(uniqueValues);
	const mintAddress = fetchedPositions.at(-1)!.zchf;
	fetchedAddresses = [mintAddress, ...collateralAddresses];

	const erc20infos = [
		{
			address: fetchedPositions.at(-1)!.zchf,
			name: fetchedPositions.at(-1)!.zchfName,
			symbol: fetchedPositions.at(-1)!.zchfSymbol,
			decimals: fetchedPositions.at(-1)!.zchfDecimals,
		},
	];

	for (let addr of fetchedAddresses) {
		const data = fetchedPositions.find((p) => p.collateral == addr);
		if (data)
			erc20infos.push({
				address: addr,
				name: data.collateralName,
				symbol: data.collateralSymbol,
				decimals: data.collateralDecimals,
			});
	}
	fetchedERC20Infos = erc20infos;

	// fetchedPrices
	const prices: { [key: Address]: PriceQuery } = {};

	// if ethereum3 private testnet
	if (WAGMI_CHAIN.id === 1337) {
		for (let erc of fetchedERC20Infos) {
			let price = { usd: 1 };

			const calc = (value: number) => {
				const ref: number = 1718033809979;
				return value * (1 + ((Date.now() - 1718033809979) / (3600 * 24)) * 0.005 + Math.random() * 0.01);
			};

			if (erc.address === ADDRESS[WAGMI_CHAIN.id].frankenCoin) price = { usd: calc(1.12) };
			if (erc.address === ADDRESS[WAGMI_CHAIN.id].mockWbtc) price = { usd: calc(69000) };
			if (erc.address === ADDRESS[WAGMI_CHAIN.id].mockLseth) price = { usd: calc(3800) };
			if (erc.address === ADDRESS[WAGMI_CHAIN.id].mockBoss) price = { usd: calc(11.54) };

			const timestamp = Date.now();

			prices[erc.address] = {
				...erc,
				timestamp,
				price,
			};
		}
	}
	// if ethereum mainnet
	else {
		const fetchSourcesCoingecko = async function (contracts: Address[]) {
			const url = (addr: Address) => `/api/v3/simple/token_price/ethereum?contract_addresses=${addr}&vs_currencies=usd`;
			return contracts.map(async (c) => await COINGECKO_CLIENT(url(c)));
		};
		const data = await Promise.allSettled(await fetchSourcesCoingecko(fetchedAddresses));

		for (let p of data) {
			if (p.status == "rejected") continue;
			if (p.value.status != 200) continue;

			const response = await p.value.json();

			const contract: Address = Object.keys(response).at(0) as Address;
			if (!contract) continue;

			const price: PriceQueryCurrencies = contract ? response[contract] : null;
			if (!price) continue;

			const erc = erc20infos.find((i) => i.address.toLowerCase() == contract);
			if (!erc) continue;

			const timestamp = Date.now();

			prices[contract] = {
				...erc,
				timestamp,
				price,
			};
		}
	}

	fetchedPrices = { ...fetchedPrices, ...prices };

	return {
		prices: fetchedPrices,
		addresses: fetchedAddresses,
		infos: fetchedERC20Infos,
	};
}

updateDetails();
setInterval(updateDetails, 5 * 60 * 1000);
