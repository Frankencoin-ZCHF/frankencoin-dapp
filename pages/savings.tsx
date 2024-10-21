import Head from "next/head";

export default function SavingsPage() {
	return (
		<main className="section">
			<Head>
				<title>Frankencoin - Savings</title>
			</Head>

			<div className="flex flex-col items-center justify-center w-full text-center" style={{ height: "60vh" }}>
				<h1 className="text-xl font-bold">Coming Soon</h1>
				<p className="text-md mt-[5rem] md:mx-[10rem]">
					A <a href="https://github.com/Frankencoin-ZCHF/FrankenCoin/blob/version2024/contracts/Savings.sol">savings module</a> is
					under construction. It aims at enabling users to temporarily lock up some of their Frankencoinss and to earn an
					interest. The plan is to go live with this feature before the end of the year. If you have inputs to its functionality,
					you can file them on <a href="https://github.com/Frankencoin-ZCHF/FrankenCoin/issues/29">github</a>.
				</p>
			</div>
		</main>
	);
}
