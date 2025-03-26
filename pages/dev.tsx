import Head from "next/head";
import { useAccount, useWalletClient } from "wagmi";
import { parseEther } from "viem";
import { toast } from "react-toastify";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { SectionTitle } from "@components/SectionTitle";
import { useState } from "react";
import Button from "@components/Button";
import { actions } from "../redux/slices/prices.slice";
import { useDispatch, useSelector } from "react-redux";
import { ApiPriceMapping } from "@deuro/api";
import AppCard from "@components/AppCard";
import Link from "next/link";
import { RootState } from "../redux/redux.store";
import { ADDRESS } from "@deuro/eurocoin";

export default function Dev() {
	const positions = useSelector((state: RootState) => state.positions.list.list);
	const coingeckoPrices = useSelector((state: RootState) => state.prices.coingecko);

	const { address } = useAccount();
	const { data: walletClient } = useWalletClient();
	const dispatch = useDispatch();
	const [prices, setPrices] = useState(coingeckoPrices);
	const [wrapAmount, setWrapAmount] = useState(10);
	const [blocks, setBlocks] = useState(10);
	const [time, setTime] = useState(5);
	const [blockNumber, setBlockNumber] = useState(0);
	const [blockTimestamp, setBlockTimestamp] = useState(0);

	const [newPrice, setNewPrice] = useState({
		address: "",
		name: "",
		symbol: "",
		decimals: 18,
		timestamp: Date.now(),
		price: { usd: 1, eur: 1 },
	});

	const handleUpdatePrice = (address: string, currency: "usd" | "eur", price: number, e: React.ChangeEvent<HTMLInputElement>) => {
		e.preventDefault();
		console.log(prices);
		// @ts-ignore
		setPrices(p => ({ ...p, [address.toLowerCase()]: { ...p[address.toLowerCase()], price: { ...p[address.toLowerCase()].price, [currency]: price } } }));
	};

	const handleAddPrice = () => {
		// @ts-ignore
		setPrices(p => ({ ...p, [newPrice.address]: newPrice }));
		setNewPrice({ address: "", name: "", symbol: "", decimals: 18, timestamp: Date.now(), price: { usd: 1, eur: 1 } });
	};

	return (
		<div>
			<Head>
				<title>dEURO - dev</title>
			</Head>

			<div className="flex flex-col gap-[4rem] mt-[4rem]">
			<AppCard>
				<SectionTitle>Pin this page</SectionTitle>
				<div className="flex flex-col gap-4">
					<span>
						Show this page in the navigation bar.
					</span>
					<button onClick={() => {
						localStorage.setItem("dev-deuro", "true");
						window.location.reload();
					}} className="bg-blue-500 px-4 py-2 rounded-lg">
						Pin
					</button>
					<button onClick={() => {
						localStorage.removeItem("dev-deuro");
						window.location.reload();
					}} className="bg-red-500 px-4 py-2 rounded-lg">
						Unpin
					</button>
				</div>
				</AppCard>
				<AppCard>
					<SectionTitle>Prices</SectionTitle>
					<span className="text-sm text-text-muted">
						These values should come from the API (COINGECKO) when the system is ready, but for now we are using mock data that we can
						change frontend-side using this form.
					</span>
					<div className="flex flex-col gap-4">
						{Object.values(prices).map((price) => (
							<div key={price.address} className="mt-2 border border-border-secondary rounded-lg p-4 flex flex-col gap-4">
								<div>
									<span className="text-base leading-tight font-extrabold">
										{price.name} ({price.symbol})
									</span>{" "}
									- {price.address}
								</div>
								<div>
									<label className="mr-2">USD</label>
									<input
										type="text"
										value={price?.price?.usd}
										onChange={(e) => handleUpdatePrice(price.address, "usd", Number(e.target.value), e)}
										className="bg-layout-primary"
									/>
								</div>
								<div>
									<label className="mr-2">EUR</label>
									<input
										type="text"
										value={price?.price?.eur}
										onChange={(e) => handleUpdatePrice(price.address, "eur", Number(e.target.value), e)}
										className="bg-layout-primary"
									/>
								</div>
							</div>
						))}
						<div>
							<Button
								className="inline-block max-w-fit"
								onClick={() => dispatch(actions.setListMapping(prices as ApiPriceMapping))}
							>
								Update all prices
							</Button>
						</div>
					</div>
					<div className="mt-8 grid grid-cols-2 gap-4 border-t border-border-secondary py-4">
						<div>
							<label className="mr-2">Address</label>
							<input
								type="text"
								value={newPrice.address}
								onChange={(e) => setNewPrice({ ...newPrice, address: e.target.value })}
								className="bg-layout-primary"
							/>
						</div>
						<div>
							<label className="mr-2">Name</label>
							<input
								type="text"
								value={newPrice.name}
								onChange={(e) => setNewPrice({ ...newPrice, name: e.target.value })}
								className="bg-layout-primary"
							/>
						</div>
						<div>
							<label className="mr-2">Symbol</label>
							<input
								type="text"
								value={newPrice.symbol}
								onChange={(e) => setNewPrice({ ...newPrice, symbol: e.target.value })}
								className="bg-layout-primary"
							/>
						</div>
						<div>
							<label className="mr-2">Decimals</label>
							<input
								type="number"
								value={newPrice.decimals}
								onChange={(e) => setNewPrice({ ...newPrice, decimals: Number(e.target.value) })}
								className="bg-layout-primary"
							/>
						</div>
						<div>
							<label className="mr-2">USD</label>
							<input
								type="number"
								value={newPrice.price.usd}
								onChange={(e) => setNewPrice({ ...newPrice, price: { ...newPrice.price, usd: Number(e.target.value) } })}
								className="bg-layout-primary"
							/>
						</div>
						<div>
							<label className="mr-2">EUR</label>
							<input
								type="number"
								value={newPrice.price.eur}
								onChange={(e) => setNewPrice({ ...newPrice, price: { ...newPrice.price, eur: Number(e.target.value) } })}
								className="bg-layout-primary"
							/>
						</div>
						<Button className="inline-block max-w-fit" onClick={handleAddPrice}>
							Add new price
						</Button>
					</div>
				</AppCard>
				<AppCard>
					<SectionTitle>Positions</SectionTitle>
					<div className="flex flex-col gap-6">
						{positions.map((position) => (
							<div key={position.position} className="flex flex-col gap-2">
								<span>
									<b>address:</b> {position.position}
								</span>
								<span>
									<b>collateral:</b> {position.collateral}
								</span>
								<span>
									<b>expiration:</b> {position.expiration}
								</span>
								<Link href={`/mint/${position.position}`} className="text-blue-500">
									Clone
								</Link>
							</div>
						))}
					</div>
				</AppCard>
				<AppCard>
					<SectionTitle>Chain utilities</SectionTitle>
					<div className="flex flex-col gap-4 mt-4">
						<span>For wrapping ETH</span>
						<div>
							<label className="mr-2">Amount</label>
							<input
								type="number"
								value={wrapAmount}
								onChange={(e) => setWrapAmount(Number(e.target.value))}
								className="bg-layout-primary"
							/>
						<button
							onClick={async () => {
								try {
									if (!walletClient || !address) {
										toast.error("Please connect wallet");
										return;
									}
									await walletClient.sendTransaction({
										account: address,
										to: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
										value: parseEther(wrapAmount.toString()),
									});
									toast.success("Transaction sent");
								} catch (err) {
									toast.error("Transaction failed");
								}
							}}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-fit	"
						>
							Wrap ETH
						</button>

						</div>
					</div>
					<div className="flex flex-col gap-4 mt-4">
						<span>For Advancing blocks</span>
						<div>
							<label className="mr-2">blocks</label>
							<input
								type="number"
								value={blocks}
								onChange={(e) => setBlocks(Number(e.target.value))}
								className="bg-layout-primary"
							/>
						<button
							onClick={async () => {
								try {
									for (let i = 0; i < blocks; i++) {
										await fetch("http://127.0.0.1:8545", {
											method: "POST",
											headers: { "Content-Type": "application/json" },
											body: JSON.stringify({
										  jsonrpc: "2.0", 
										  method: "hardhat_mine",
										  params: [`0x${(1).toString(16)}`], // Convert to hex string
										  id: 1
										})
									  });
									}
									toast.success("Transaction sent");
								} catch (err) {
									toast.error("Transaction failed");
								}
							}}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-fit	"
						>
							Advance blocks
						</button>

						</div>
					</div>
					<div className="flex flex-col gap-4 mt-4">
						<span>For Advancing time</span>
						<div>
							<label className="mr-2">Days</label>
							<input
								type="number"
								value={time}
								onChange={(e) => setTime(Number(e.target.value))}
								className="bg-layout-primary"
							/>
						<button
							onClick={async () => {
								try {
									await fetch("http://127.0.0.1:8545", {
										method: "POST",
										headers: { "Content-Type": "application/json" },
										body: JSON.stringify({
										  jsonrpc: "2.0",
										  method: "evm_increaseTime",
										  params: [time * 24 * 60 * 60], 
										  id: 1
										})
									  });
									toast.success("Transaction sent");
								} catch (err) {
									toast.error("Transaction failed");
								}
							}}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-fit	"
						>
							Advance time
						</button>

						</div>
					</div>
					<div className="flex flex-col gap-4 mt-4">
						<span>Chain data</span>
						<div>
							<span className="mr-2">Block number</span>
							<span>{blockNumber}</span>
						</div>
						<div>
							<span className="mr-2">Block timestamp</span>
							<span>{blockTimestamp} - {new Date(blockTimestamp * 1000).toLocaleString()}</span>
						</div>
						<div>
							<button onClick={async () => {
								const response = await fetch("http://127.0.0.1:8545", {
									method: "POST",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({
									  jsonrpc: "2.0",
									  method: "eth_getBlockByNumber",
									  params: ["latest", false],
									  id: 1
									})
								  });
								  
								  const block = await response.json();
								  const timestamp = parseInt(block.result.timestamp, 16);
								  const blockNumber = parseInt(block.result.number, 16);
								  setBlockTimestamp(timestamp);
								  setBlockNumber(blockNumber);
								}}
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-fit	"
							>
								Get block data
							</button>
						</div>
					</div>
				</AppCard>
			</div>
		</div>
	);
}

export async function getStaticProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ["common"])),
		},
	};
}


const mockPrices = {
	[ADDRESS[1].decentralizedEURO.toLowerCase() as `0x${string}`]: {
		address: ADDRESS[1].decentralizedEURO.toLowerCase() as `0x${string}`,
		name: "dEURO",
		symbol: "dEURO",
		decimals: 18,
		timestamp: 1740163301311,
		price: {
			usd: 1.05,
			eur: 1,
		},
	},
	[ADDRESS[1].equity.toLowerCase() as `0x${string}`]: {
		address: ADDRESS[1].equity.toLowerCase() as `0x${string}`,
		name: "nDEPS",
		symbol: "nDEPS",
		decimals: 18,
		timestamp: 1740163301311,
		price: {
			usd: 200500,
			eur: 200000,
		},
	},
	"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": {
		address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
		name: "Wrapped Ether",
		symbol: "WETH",
		decimals: 18,
		timestamp: 1740163301311,
		price: {
			usd: 2500,
			eur: 2100,
		},
	},
	[("0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c").toLowerCase() as `0x${string}`]: {
		address: ("0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c").toLowerCase() as `0x${string}`,
		name: "EURC",
		symbol: "EURC",
		decimals: 18,
		timestamp: 1740163301311,
		price: {
			usd: 2500,
			eur: 2100,
		},
	}
}