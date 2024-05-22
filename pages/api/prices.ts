import type { NextApiRequest, NextApiResponse } from "next";
import { PriceQueryObjectArray, PriceQuery, PriceQueryCurrencies } from "../../redux/slices/prices.types";
import { clientCoingecko, clientPonder } from "../../app.config";
import { gql } from "@apollo/client";
import { Address, getAddress } from "viem";
import { ERC20Info, PositionQuery } from "../../redux/slices/positions.types";
import { uniqueValues } from "../../utils/format-array";
import { fetchPositions } from "./positions";

let fetchedPositions: PositionQuery[] = [];
let fetchedAddresses: Address[] = [];
let fetchedERC20Infos: ERC20Info[] = [];
let fetchedPrices: PriceQueryObjectArray = {
	"0xb58e61c3098d85632df34eecfb899a1ed80921cb": {
		address: "0xB58E61C3098d85632Df34EecfB899A1Ed80921cB",
		name: "Frankencoin",
		symbol: "ZCHF",
		decimals: 18,
		timestamp: 1716389270047,
		price: {
			usd: 1.098,
		},
	},
	"0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": {
		address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
		name: "Wrapped BTC",
		symbol: "WBTC",
		decimals: 8,
		timestamp: 1716389270047,
		price: {
			usd: 69942,
		},
	},
	"0x8747a3114ef7f0eebd3eb337f745e31dbf81a952": {
		address: "0x8747a3114Ef7f0eEBd3eB337F745E31dBF81a952",
		name: "Draggable quitt.shares",
		symbol: "DQTS",
		decimals: 0,
		timestamp: 1716389270047,
		price: {
			usd: 8.91,
		},
	},
	"0x8c1bed5b9a0928467c9b1341da1d7bd5e10b6549": {
		address: "0x8c1BEd5b9a0928467c9B1341Da1D7BD5e10b6549",
		name: "Liquid Staked ETH",
		symbol: "LsETH",
		decimals: 18,
		timestamp: 1716389270047,
		price: {
			usd: 3875.55,
		},
	},
	"0x553c7f9c780316fc1d34b8e14ac2465ab22a090b": {
		address: "0x553C7f9C780316FC1D34b8e14ac2465Ab22a090B",
		name: "RealUnit Shares",
		symbol: "REALU",
		decimals: 0,
		timestamp: 1716389270047,
		price: {
			usd: 1.11,
		},
	},
	"0x2e880962a9609aa3eab4def919fe9e917e99073b": {
		address: "0x2E880962A9609aA3eab4DEF919FE9E917E99073B",
		name: "Boss Info AG",
		symbol: "BOSS",
		decimals: 0,
		timestamp: 1716389270047,
		price: {
			usd: 11.54,
		},
	},
};

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
	console.log(`Updating [Details] for /api/details`);

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

	const fetchSourcesCoingecko = async function (contracts: Address[]) {
		const url = (addr: Address) => `/api/v3/simple/token_price/ethereum?contract_addresses=${addr}&vs_currencies=usd`;
		return contracts.map(async (c) => await clientCoingecko(url(c)));
	};

	// fetch from coingecko
	const data = await Promise.allSettled(await fetchSourcesCoingecko(fetchedAddresses));
	const prices: { [key: Address]: PriceQuery } = {};

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

	fetchedPrices = { ...fetchedPrices, ...prices };

	return {
		prices: fetchedPrices,
		addresses: fetchedAddresses,
		infos: fetchedERC20Infos,
	};
}

updateDetails();
setInterval(updateDetails, 1 * 60 * 1000);
